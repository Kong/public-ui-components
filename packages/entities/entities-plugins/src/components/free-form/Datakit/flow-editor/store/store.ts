import { createInjectionState } from '@vueuse/core'
import { computed, ref } from 'vue'
import type {
  ConfigNode,
  CreateNodePayload,
  EdgeData,
  EdgeId,
  EdgeInstance,
  EditorState,
  FieldId,
  FieldName,
  NameConnection,
  NodeId,
  NodeInstance,
  NodeName,
  UINode,
} from '../../types'
import { IMPLICIT_NODE_META_MAP, isImplicitName, isImplicitType } from '../node/node'
import {
  createId,
  clone,
  findFieldById,
  generateNodeName,
} from './helpers'
import { useTaggedHistory } from './history'
import { initEditorState, makeNodeInstance } from './init'
import { useValidators } from './validation'

type CreateEditorStoreOptions = {
  onChange?: (config: { nodes: ConfigNode[] }) => void
}

const [provideEditorStore, useOptionalEditorStore] = createInjectionState(
  function createState(configNodes: ConfigNode[], uiNodes: UINode[], options: CreateEditorStoreOptions = {}) {
    const state = ref<EditorState>(initEditorState(configNodes, uiNodes))
    const selection = ref<NodeId>()
    const modalOpen = ref(false)
    const propertiesPanelOpen = ref(false)

    const history = useTaggedHistory(state, {
      capacity: 200,
      clone,
      onHistoryChange: (action) => {
        // clear only affects the history, not the state
        if (action === 'clear') {
          return
        }

        options.onChange?.({
          nodes: toConfigNodes(),
        })
      },
    })
    const newCreatedNodeId = ref<NodeId | null>(null)
    const invalidConfigNodeIds = ref<Set<NodeId>>(new Set())

    // maps
    const nodeMapById = computed(
      () =>
        new Map<NodeId, NodeInstance>(
          state.value.nodes.map((node) => [node.id, node]),
        ),
    )
    const nodeMapByName = computed(
      () =>
        new Map<NodeName, NodeInstance>(
          state.value.nodes.map((node) => [node.name, node]),
        ),
    )
    const edgeMaps = computed(
      () => {
        const edgeMapById = new Map<EdgeId, EdgeInstance>()
        const edgeIdMapByNodeId = new Map<NodeId, Set<EdgeId>>()

        for (const edge of state.value.edges) {
          edgeMapById.set(edge.id, edge)

          if (!edgeIdMapByNodeId.has(edge.source)) {
            edgeIdMapByNodeId.set(edge.source, new Set())
          }
          edgeIdMapByNodeId.get(edge.source)!.add(edge.id)

          if (!edgeIdMapByNodeId.has(edge.target)) {
            edgeIdMapByNodeId.set(edge.target, new Set())
          }
          edgeIdMapByNodeId.get(edge.target)!.add(edge.id)
        }

        return {
          edgeMapById,
          edgeIdMapByNodeId,
        }
      },
    )
    const edgeMapById = computed(() => edgeMaps.value.edgeMapById)
    const edgeIdMapByNodeId = computed(() => edgeMaps.value.edgeIdMapByNodeId)

    // sets
    const nodeNames = computed(
      () => new Set(state.value.nodes.map((node) => node.name)),
    )

    // validators bound to current maps
    const {
      canonicalizeConnection,
      validateConnection,
      validateGraph,
      isValidConnection,
      isValidVueFlowConnection,
    } = useValidators(state)

    // O(1) getters
    function getNodeById(id: NodeId) {
      return nodeMapById.value.get(id)
    }
    function getNodeByName(name: NodeName) {
      return nodeMapByName.value.get(name)
    }
    function getEdgeById(id: EdgeId) {
      return edgeMapById.value.get(id)
    }

    // O(n) getters (n = edges)
    function getEdgesByNodeId(nodeId: NodeId) {
      if (!edgeIdMapByNodeId.value.has(nodeId)) {
        return []
      }
      const edges: EdgeInstance[] = []
      edgeIdMapByNodeId.value.get(nodeId)!.forEach(edgeId => {
        const edge = getEdgeById(edgeId)
        if (edge) {
          edges.push(edge)
        }
      })
      return edges
    }
    function getInEdgesByNodeId(nodeId: NodeId) {
      return getEdgesByNodeId(nodeId).filter((edge => edge.target === nodeId))
    }
    function getOutEdgesByNodeId(nodeId: NodeId) {
      return getEdgesByNodeId(nodeId).filter((edge => edge.source === nodeId))
    }

    const selectedNode = computed(() =>
      selection.value ? getNodeById(selection.value) : undefined,
    )
    function selectNode(id?: NodeId) {
      selection.value = id
    }

    /* ---------- node ops ---------- */

    function createNode(payload: CreateNodePayload): NodeInstance {
      if (isImplicitType(payload.type)) {
        throw new Error('[createNode] implicit nodes are fixed.')
      }

      return makeNodeInstance({
        type: payload.type,
        name:
          payload.name ||
          (!isImplicitType(payload.type)
            ? generateNodeName(payload.type, nodeNames.value)
            : undefined),
        // default to 'request' phase for request nodes
        phase: payload.phase,
        position: payload.position,
        fields: payload.fields,
        config: payload.config,
      })
    }

    function addNode(payload: CreateNodePayload, commitNow = true) {
      const node = createNode(payload)
      if (!node) return

      state.value.nodes.push(node)
      if (commitNow) history.commit()
      return node.id
    }

    function removeNode(nodeId: NodeId, commitNow = true) {
      state.value.edges = state.value.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      )
      state.value.nodes = state.value.nodes.filter(
        (node) => node.id !== nodeId,
      )
      if (selection.value === nodeId) selection.value = undefined

      const topo = validateGraph()
      if (!topo.ok) {
        console.warn('[removeNode] topology invalid:', topo.errors.join('; '))
      }

      if (commitNow) history.commit()
    }

    function renameNode(nodeId: NodeId, newName: NodeName, commitNow = true, tag?: string) {
      const node = getNodeById(nodeId)
      if (!node) return
      if (isImplicitName(node.name)) {
        console.warn('[renameNode] implicit node name is reserved.')
        return
      }
      node.name = newName
      if (commitNow) history.commit(tag)
    }

    // Move node to a new position
    // This should be called only once after a consecutive drag operation
    // to avoid multiple commits for each drag event.
    function moveNode(
      nodeId: NodeId,
      position: { x: number, y: number },
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      node.position = { ...position }
      if (commitNow) history.commit()
    }

    function toggleExpanded(
      nodeId: NodeId,
      io: 'input' | 'output',
      value?: boolean,
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      node.expanded[io] = value ?? !node.expanded[io]
      if (commitNow) history.commit(`toggle:${nodeId}:${io}`)
    }

    function replaceConfig(
      nodeId: NodeId,
      next: Record<string, unknown>,
      commitNow = true,
      tag?: string,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      node.config = clone(next)
      if (commitNow) history.commit(tag)
    }

    /* ---------- field ops ---------- */

    function addField(
      nodeId: NodeId,
      io: 'input' | 'output',
      name: FieldName,
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      const fields = node.fields[io]
      if (fields.some((field) => field.name === name)) {
        console.warn(`[addField] field "${name}" already exists on ${io}.`)
        return
      }
      fields.push({ id: createId('field'), name })
      if (io === 'input') node.fields.input = fields
      else node.fields.output = fields
      if (commitNow) history.commit()
    }

    function renameField(
      nodeId: NodeId,
      fieldId: FieldId,
      newName: FieldName,
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      const inputFields = node.fields.input
      const outputFields = node.fields.output
      const field =
        inputFields.find((field) => field.id === fieldId) ??
        outputFields.find((field) => field.id === fieldId)
      if (!field) return
      field.name = newName
      if (commitNow) history.commit()
    }

    function removeField(
      nodeId: NodeId,
      fieldId: FieldId,
      cascade = true,
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      const inputFields = node.fields.input
      const outputFields = node.fields.output

      const inputIndex = inputFields.findIndex((field) => field.id === fieldId)
      if (inputIndex >= 0) inputFields.splice(inputIndex, 1)

      const outputIndex = outputFields.findIndex(
        (field) => field.id === fieldId,
      )
      if (outputIndex >= 0) outputFields.splice(outputIndex, 1)

      node.fields.input = inputFields
      node.fields.output = outputFields

      if (cascade) {
        state.value.edges = state.value.edges.filter(
          (edge) => edge.sourceField !== fieldId && edge.targetField !== fieldId,
        )
      }

      const topo = validateGraph()
      if (!topo.ok) {
        console.warn('[removeField] topology invalid:', topo.errors.join('; '))
      }

      if (commitNow) history.commit()
    }

    /* ---------- edge ops (two-step validation) ---------- */

    function connectEdge(payload: EdgeData, commitNow = true) {
      const canonical = canonicalizeConnection(payload)
      const local = validateConnection(canonical)
      if (!local.ok) {
        console.warn(
          '[connectEdge] invalid connection:',
          local.errors.join('; '),
        )
        return
      }
      const edge: EdgeInstance = { id: createId('edge'), ...canonical }
      state.value.edges.push(edge)

      const topo = validateGraph()
      if (!topo.ok) {
        state.value.edges.pop()
        console.warn('[connectEdge] topology invalid:', topo.errors.join('; '))
        return
      }
      if (commitNow) history.commit()
      return edge.id
    }

    function replaceConnection(
      edgeId: EdgeId,
      next: EdgeData,
      commitNow = true,
    ) {
      disconnectEdge(edgeId, false)
      connectEdge(next, false)
      if (commitNow) history.commit()
    }

    function disconnectEdge(edgeId: EdgeId, commitNow = true) {
      const index = state.value.edges.findIndex((edge) => edge.id === edgeId)
      if (index < 0) return
      const backup = state.value.edges[index]
      state.value.edges.splice(index, 1)

      const topo = validateGraph()
      if (!topo.ok) {
        state.value.edges.splice(index, 0, backup)
        console.warn(
          '[disconnectEdge] topology invalid:',
          topo.errors.join('; '),
        )
        return
      }

      if (commitNow) history.commit()
    }

    function disconnectInEdges(nodeId: NodeId, commitNow = true) {
      const edges = getInEdgesByNodeId(nodeId)
      for (const edge of edges) {
        disconnectEdge(edge.id, false)
      }
      if (commitNow) history.commit()
    }

    function disconnectOutEdges(nodeId: NodeId, commitNow = true) {
      const edges = getOutEdgesByNodeId(nodeId)
      for (const edge of edges) {
        disconnectEdge(edge.id, false)
      }
      if (commitNow) history.commit()
    }

    /* ---------- serialization ---------- */

    function toConfigNodes(): ConfigNode[] {
      const result: ConfigNode[] = []

      for (const node of state.value.nodes) {
        if (isImplicitType(node.type)) {
          continue
        }

        // Prefer inputs-only by default
        let nodeInput: NameConnection | undefined
        const fieldInputs: Record<FieldName, NameConnection> = {}

        // Only record outputs when the target is an implicit node that accepts inputs
        let nodeOutput: NameConnection | undefined
        const fieldOutputs: Record<FieldName, NameConnection> = {}

        // incoming -> inputs
        for (const edge of state.value.edges.filter((edge) => edge.target === node.id)) {
          const sourceNode = getNodeById(edge.source)
          if (!sourceNode) {
            continue
          }

          const sourceFieldName = findFieldById(sourceNode, 'output', edge.sourceField)?.name
          const input: NameConnection = sourceFieldName
            ? `${sourceNode.name}.${sourceFieldName}`
            : sourceNode.name

          const targetFieldName = findFieldById(node, 'input', edge.targetField)?.name
          if (targetFieldName) {
            fieldInputs[targetFieldName] = input
          } else if (nodeInput === undefined) {
            nodeInput = input
          }
        }

        // outgoing -> outputs only if target is implicit & accepts input
        for (const edge of state.value.edges.filter((edge) => edge.source === node.id)) {
          const targetNode = getNodeById(edge.target)
          if (!targetNode) {
            continue
          }

          const type = targetNode.type
          if (!isImplicitType(type)) {
            continue
          }
          if (!IMPLICIT_NODE_META_MAP[type].io?.input) {
            continue // only connect to implicit nodes that accept inputs
          }

          const targetFieldName = findFieldById(targetNode, 'input', edge.targetField)?.name
          const output: NameConnection = targetFieldName
            ? `${targetNode.name}.${targetFieldName}`
            : targetNode.name

          const sourceFieldName = findFieldById(node, 'output', edge.sourceField)?.name
          if (sourceFieldName) {
            fieldOutputs[sourceFieldName] = output
          } else if (nodeOutput === undefined) {
            nodeOutput = output
          }
        }

        const configNode: ConfigNode = {
          ...clone(node.config),
          name: node.name,
          type: node.type,
        } as ConfigNode

        const hasNamedInputs = Object.keys(fieldInputs).length > 0
        // inputs and input should be mutually exclusive
        if (hasNamedInputs) {
          configNode.inputs = fieldInputs
        } else if (nodeInput !== undefined) {
          configNode.input = nodeInput
        }

        const hasNamedOutputs = Object.keys(fieldOutputs).length > 0
        // outputs and output should be mutually exclusive
        if (hasNamedOutputs) {
          configNode.outputs = fieldOutputs
        } else if (nodeOutput !== undefined) {
          configNode.output = nodeOutput
        }

        result.push(configNode)
      }

      return result
    }

    function toUINodes(): UINode[] {
      return state.value.nodes.map((node) =>
        clone({
          name: node.name,
          phase: node.phase,
          position: { ...node.position },
          expanded: { ...node.expanded },
          fields: {
            input: node.fields.input.map((field) => field.name),
            output: node.fields.output.map((field) => field.name),
          },
        }),
      )
    }

    function load(nextConfig: ConfigNode[], nextUI: UINode[]) {
      state.value = initEditorState(nextConfig, nextUI)
      history.reset()
    }

    return {
      // state
      state,
      selection,
      modalOpen,
      newCreatedNodeId,
      invalidConfigNodeIds,
      propertiesPanelOpen,

      // maps & getters
      nodeMapById,
      nodeMapByName,
      edgeMapById,
      edgeIdMapByNodeId,
      getNodeById,
      getNodeByName,
      getEdgeById,
      getEdgesByNodeId,
      getInEdgesByNodeId,
      getOutEdgesByNodeId,
      selectedNode,
      selectNode,

      // node ops
      createNode,
      addNode,
      removeNode,
      renameNode,
      moveNode,
      toggleExpanded,
      replaceConfig,

      // field ops
      addField,
      renameField,
      removeField,

      // edge ops
      connectEdge,
      replaceConnection,
      disconnectEdge,
      disconnectInEdges,
      disconnectOutEdges,

      // serialization
      toConfigNodes,
      toUINodes,
      load,

      // history
      commit: history.commit,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      clear: history.clear,
      reset: history.reset,

      // validation helpers for UI
      isValidConnection,
      isValidVueFlowConnection,
      validateGraph: () => validateGraph(),
    }
  },
)

export { provideEditorStore }

export function useEditorStore() {
  const store = useOptionalEditorStore()
  if (!store) {
    throw new Error('Editor state is not provided. Ensure you are using provideEditorStore in a parent component.')
  }
  return store
}

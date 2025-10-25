import type { Dimensions, XYPosition } from '@vue-flow/core'
import type {
  ConfigNode,
  CreateNodePayload,
  DatakitConfig,
  DatakitPluginData,
  EdgeData,
  EdgeId,
  EdgeInstance,
  EditorState,
  FieldId,
  FieldName,
  DatakitUIData,
  NameConnection,
  NodeId,
  NodeInstance,
  NodeName,
  UINode,
  GroupId,
  GroupInstance,
  UIGroup,
} from '../../types'

import { createInjectionState } from '@vueuse/core'
import { computed, ref } from 'vue'
import { IMPLICIT_NODE_META_MAP, isImplicitName, isImplicitType } from '../node/node'
import { clone, createId, findFieldById, generateNodeName, getBranchesFromMeta, makeGroupName } from './helpers'
import { createBranchGroups } from './branch-groups'
import { useTaggedHistory } from './history'
import { initEditorState, makeNodeInstance } from './init'
import { useValidators } from './validation'
import { vaultConfigToResources, type VaultConfig } from '../node/vault'

type CreateEditorStoreOptions = {
  /**
   * Whether the editor is in editing mode (versus the creation mode)
   */
  isEditing?: boolean
  onChange?: (
    configNodes: ConfigNode[],
    uiData: DatakitUIData,
    resources: DatakitConfig['resources']
  ) => void
}

const [provideEditorStore, useOptionalEditorStore] = createInjectionState(
  function createState(pluginData: DatakitPluginData, options: CreateEditorStoreOptions = {}) {
    const state = ref<EditorState>(initEditorState(pluginData))
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
        options.onChange?.(toConfigNodes(), toUIData(), toResources())
      },
    })
    const skipValidation = ref(false)
    const invalidConfigNodeIds = ref<Set<NodeId>>(new Set())

    // This is one way because `pendingLayout` should only be set to `true` on init.
    function clearPendingLayout() {
      state.value.pendingLayout = false
      history.commit('*')
    }

    // Mark the current state as needing a `fitView`. Does not guarantee the immediate execution.
    function setPendingFitView(isPending = true) {
      if (state.value.pendingFitView === isPending)
        return

      state.value.pendingFitView = isPending
      history.commit('*')
    }

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
    const groupMapById = computed(
      () =>
        new Map<GroupId, GroupInstance>(
          state.value.groups.map((group) => [group.id, group]),
        ),
    )

    // sets
    const nodeNames = computed(
      () => new Set(state.value.nodes.map((node) => node.name)),
    )

    const branchGroups = createBranchGroups({ state, groupMapById, getNodeById, history })

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

    function addNode(payload: CreateNodePayload, commitNow = true): NodeId | undefined {
      const node = createNode(payload)
      if (!node) return

      state.value.nodes.push(node)
      if (commitNow) history.commit()

      skipValidation.value = true

      return node.id
    }

    function duplicateNode(nodeId: NodeId, position?: XYPosition, commitNow = true): NodeId | undefined {
      const node = getNodeById(nodeId)
      if (!node || isImplicitType(node.type)) return

      const newNode = {
        ...clone(node),
        id: createId('node'),
        name: generateNodeName(node.name, nodeNames.value),
        position: position ?? {
          x: node.position.x + 20,
          y: node.position.y + 20,
        },
      }

      const branchKeys = getBranchesFromMeta(newNode.type)
      if (branchKeys.length && newNode.config) {
        for (const branch of branchKeys) {
          delete newNode.config[branch]
        }

        if (Object.keys(newNode.config).length === 0) {
          delete newNode.config
        }
      }

      state.value.nodes.push(newNode)
      if (commitNow) history.commit()

      skipValidation.value = true

      return newNode.id
    }

    function removeNode(nodeId: NodeId, commitNow = true) {
      const node = getNodeById(nodeId)
      if (!node) return

      state.value.edges = state.value.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      )

      branchGroups.clear(nodeId)

      state.value.nodes = state.value.nodes.filter(
        (node) => node.id !== nodeId,
      )
      if (selection.value === nodeId) selection.value = undefined

      branchGroups.dropTarget(nodeId)

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
      const prevName = node.name
      if (prevName === newName) return

      node.name = newName
      if (commitNow) history.commit(tag)
    }

    // Move node to a new position
    // This should be called only once after a consecutive drag operation
    // to avoid multiple commits for each drag event.
    function moveNode(
      nodeId: NodeId,
      position: XYPosition,
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      node.position = { ...position }
      if (commitNow) history.commit()
    }

    function moveGroup(groupId: GroupId, position: XYPosition, commitNow = true) {
      const group = groupMapById.value.get(groupId)
      if (!group) return

      const current = group.position
      if (current && current.x === position.x && current.y === position.y) {
        return
      }

      group.position = { ...position }
      if (commitNow) history.commit()
    }

    function setGroupLayout(
      groupId: GroupId,
      layout: { position: XYPosition, dimensions: Dimensions },
      commitNow = true,
    ): boolean {
      const group = groupMapById.value.get(groupId)
      if (!group) return false

      const nextPosition = { ...layout.position }
      const nextDimensions = { ...layout.dimensions }

      const samePosition =
        group.position
        && group.position.x === nextPosition.x
        && group.position.y === nextPosition.y

      const sameDimensions =
        group.dimensions
        && group.dimensions.width === nextDimensions.width
        && group.dimensions.height === nextDimensions.height

      if (samePosition && sameDimensions) return false

      group.position = nextPosition
      group.dimensions = nextDimensions

      if (commitNow) history.commit()
      return true
    }

    function toggleExpanded(
      nodeId: NodeId,
      io: 'input' | 'output',
      value?: boolean,
      commitNow = true,
      tag?: string,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return

      const newValue = value ?? !node.expanded[io]
      if (newValue === !!node.expanded[io]) return

      node.expanded[io] = newValue
      if (commitNow) history.commit(tag ?? `toggle:${nodeId}:${io}`)
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

        const branchKeys = getBranchesFromMeta(node.type)
        if (branchKeys.length) {
          for (const branchKey of branchKeys) {
            const raw = (configNode as Record<string, unknown>)[branchKey]
            if (!Array.isArray(raw)) {
              continue
            }

            const names: NodeName[] = []
            for (const entry of raw as NodeId[]) {
              const targetNode = getNodeById(entry)
              if (targetNode) {
                names.push(targetNode.name)
              }
            }

            if (names.length) {
              (configNode as Record<string, unknown>)[branchKey] = Array.from(new Set(names))
            } else {
              delete (configNode as Record<string, unknown>)[branchKey]
            }
          }
        }

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

    function toResources(): DatakitConfig['resources'] {
      const vaultNode = getNodeByName('vault')
      // todo(zehao): support `resources.cache`
      // Konnect use `PUT` to update the plugin, so we can return undefined to clear the resources
      if (!vaultNode) return
      const vault = vaultConfigToResources(vaultNode.config as VaultConfig)
      if (!vault || Object.keys(vault).length === 0) return
      return {
        vault,
      }
    }

    function toUIGroups(): UIGroup[] {
      const uiGroups: UIGroup[] = []
      for (const group of state.value.groups) {
        const owner = getNodeById(group.ownerId)
        if (!owner) continue
        const position = group.position
        if (!position) continue
        uiGroups.push({
          name: makeGroupName(owner.name, group.branch),
          position: { ...position },
        })
      }
      return uiGroups
    }

    function toUIData(): DatakitUIData {
      return {
        nodes: toUINodes(),
        groups: toUIGroups(),
      }
    }

    /**
     * Load the given configuration and UI state into the editor.
     *
     * This REPLACES the entire editor state.
     *
     * To commit the current state in the undo history before load and keep the history,
     * set `keepHistory` to `true` (default: `false`).
     */
    function load(pluginData: DatakitPluginData, keepHistory?: boolean) {
      if (keepHistory)
        history.commit()

      state.value = initEditorState(pluginData, keepHistory)

      if (!keepHistory)
        history.clear()
    }

    return {
      // state
      state,
      selection,
      modalOpen,
      skipValidation,
      invalidConfigNodeIds,
      propertiesPanelOpen,

      // maps & getters
      nodeMapById,
      nodeMapByName,
      edgeMapById,
      edgeIdMapByNodeId,
      groupMapById,
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
      duplicateNode,
      removeNode,
      renameNode,
      moveNode,
      moveGroup,
      setGroupLayout,
      toggleExpanded,
      replaceConfig,
      branchGroups,

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
      toUIGroups,
      toUIData,
      load,

      // history
      commit: history.commit,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      clear: history.clear,
      reset: history.reset,
      revert: history.revert,

      // validation helpers for UI
      isValidConnection,
      isValidVueFlowConnection,
      validateGraph: () => validateGraph(),

      // layout & viewport helpers
      clearPendingLayout,
      setPendingFitView,
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

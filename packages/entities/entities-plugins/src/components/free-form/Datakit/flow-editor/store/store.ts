import { computed, ref } from 'vue'
import { createInjectionState } from '@vueuse/core'
import type {
  ConfigNode,
  ConfigNodeType,
  EdgeData,
  EdgeInstance,
  EdgeId,
  EditorState,
  FieldId,
  FieldName,
  NodePhase,
  NodeInstance,
  NodeId,
  NodeName,
  UINode,
} from '../../types'
import { createId, deepClone, findFieldById } from './helpers'
import { isImplicitName, isImplicitType } from '../node/node'
import { initEditorState, makeNodeInstance } from './init'
import { useValidators } from './validation'
import { useTaggedHistory } from './history'

export const [provideEditorState, useEditorState] = createInjectionState(
  function(configNodes: ConfigNode[], uiNodes: UINode[]) {
    const state = ref<EditorState>(initEditorState(configNodes, uiNodes))
    const selection = ref<NodeId>()
    const history = useTaggedHistory(state, {
      capacity: 200,
      clone: deepClone,
    })

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
    const edgeMapById = computed(
      () =>
        new Map<EdgeId, EdgeInstance>(
          state.value.edges.map((edge) => [edge.id, edge]),
        ),
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

    const selectedNode = computed(() =>
      selection.value ? getNodeById(selection.value) : undefined,
    )
    function selectNode(id?: NodeId) {
      selection.value = id
    }

    /* ---------- node ops ---------- */

    function addNode(
      payload: {
        type: ConfigNodeType
        name?: NodeName
        phase?: NodePhase
        position?: { x: number, y: number }
        fields?: { input?: FieldName[], output?: FieldName[] }
        config?: Record<string, unknown>
      },
      commitNow = true,
    ) {
      if (isImplicitType(payload.type)) {
        console.warn('[addNode] implicit nodes are fixed.')
        return
      }
      const node = makeNodeInstance({
        type: payload.type,
        name: payload.name,
        phase: payload.phase,
        position: payload.position,
        uiFieldNames: payload.fields,
        config: payload.config,
      })
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

    function renameNode(nodeId: NodeId, newName: NodeName, commitNow = true) {
      const node = getNodeById(nodeId)
      if (!node) return
      if (isImplicitName(node.name)) {
        console.warn('[renameNode] implicit node name is reserved.')
        return
      }
      node.name = newName
      if (commitNow) history.commit()
    }

    function moveNode(
      nodeId: NodeId,
      position: { x: number, y: number },
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      node.position = { ...position }
      if (commitNow) history.commit(`move:${nodeId}`, { replace: true })
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
      if (commitNow)
        history.commit(`toggle:${nodeId}:${io}`, { replace: true })
    }

    function replaceConfig(
      nodeId: NodeId,
      next: Record<string, unknown>,
      commitNow = true,
    ) {
      const node = getNodeById(nodeId)
      if (!node) return
      node.config = deepClone(next)
      if (commitNow) history.commit()
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
      patch: Partial<Omit<EdgeInstance, 'id'>>,
      commitNow = true,
    ) {
      const edge = getEdgeById(edgeId)
      if (!edge) return
      const candidate = canonicalizeConnection({ ...edge, ...patch })

      const local = validateConnection(candidate)
      if (!local.ok) {
        console.warn(
          '[replaceConnection] invalid connection:',
          local.errors.join('; '),
        )
        return
      }

      const backup = { ...edge }
      Object.assign(edge, candidate)

      const topo = validateGraph()
      if (!topo.ok) {
        Object.assign(edge, backup)
        console.warn(
          '[replaceConnection] topology invalid:',
          topo.errors.join('; '),
        )
        return
      }
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

    /* ---------- serialization ---------- */

    function toConfigNodes(): ConfigNode[] {
      const output: ConfigNode[] = []

      for (const node of state.value.nodes) {
        if (isImplicitType(node.type)) continue

        const inputs: Record<string, string> = {}
        const outputs: Record<string, string> = {}

        // incoming -> inputs
        for (const edge of state.value.edges.filter(
          (edge) => edge.target === node.id,
        )) {
          const sourceNode = getNodeById(edge.source)
          if (!sourceNode) continue
          const sourceFieldName = findFieldById(
            sourceNode,
            'output',
            edge.sourceField,
          )?.name
          const value = sourceFieldName
            ? `${sourceNode.name}.${sourceFieldName}`
            : sourceNode.name
          const targetFieldName = findFieldById(
            node,
            'input',
            edge.targetField,
          )?.name
          if (targetFieldName) inputs[targetFieldName] = value
          else if (!('input' in inputs)) inputs.input = value
        }

        // outgoing -> outputs
        for (const edge of state.value.edges.filter(
          (edge) => edge.source === node.id,
        )) {
          const targetNode = getNodeById(edge.target)
          if (!targetNode) continue
          const targetFieldName = findFieldById(
            targetNode,
            'input',
            edge.targetField,
          )?.name
          const value = targetFieldName
            ? `${targetNode.name}.${targetFieldName}`
            : targetNode.name
          const sourceFieldName = findFieldById(
            node,
            'output',
            edge.sourceField,
          )?.name
          if (sourceFieldName) outputs[sourceFieldName] = value
          else if (!('output' in outputs)) outputs.output = value
        }

        const configNode: ConfigNode = {
          ...deepClone(node.config),
          name: node.name,
          type: node.type,
        } as ConfigNode

        const inputKeys = Object.keys(inputs)
        const outputKeys = Object.keys(outputs)

        if (inputKeys.length === 1 && inputKeys[0] === 'input')
          configNode.input = inputs.input
        else if (inputKeys.length) configNode.inputs = inputs

        if (outputKeys.length === 1 && outputKeys[0] === 'output')
          configNode.output = outputs.output
        else if (outputKeys.length) configNode.outputs = outputs

        output.push(configNode)
      }

      return output
    }

    function toUINodes(): UINode[] {
      return state.value.nodes.map((node) =>
        deepClone({
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

    /* ---------- Vue Flow adapters ---------- */

    function edgeInPhase(edge: EdgeInstance, phase: NodePhase) {
      const sourceNode = getNodeById(edge.source)
      const targetNode = getNodeById(edge.target)
      return !!(
        sourceNode &&
        targetNode &&
        sourceNode.phase === phase &&
        targetNode.phase === phase
      )
    }

    const requestNodes = computed(() =>
      state.value.nodes
        .filter((node) => node.phase === 'request')
        .map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node,
        })),
    )

    const requestEdges = computed(() =>
      state.value.edges
        .filter((edge) => edgeInPhase(edge, 'request'))
        .map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceField,
          targetHandle: edge.targetField,
          data: edge,
        })),
    )

    const responseNodes = computed(() =>
      state.value.nodes
        .filter((node) => node.phase === 'response')
        .map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node,
        })),
    )

    const responseEdges = computed(() =>
      state.value.edges
        .filter((edge) => edgeInPhase(edge, 'response'))
        .map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceField,
          targetHandle: edge.targetField,
          data: edge,
        })),
    )

    return {
      // state
      state,
      selection,

      // maps & getters
      nodeMapById,
      nodeMapByName,
      edgeMapById,
      getNodeById,
      getNodeByName,
      getEdgeById,
      selectedNode,
      selectNode,

      // node ops
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

      // Vue Flow views
      requestNodes,
      requestEdges,
      responseNodes,
      responseEdges,

      // validation helpers for UI
      isValidConnection,
      isValidVueFlowConnection,
      validateGraph: () => validateGraph(),
    }
  },
)

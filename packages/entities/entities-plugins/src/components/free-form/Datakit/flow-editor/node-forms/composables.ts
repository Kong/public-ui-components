import { computed, nextTick, ref, watch } from 'vue'
import { useEditorStore } from '../store/store'
import { buildAdjacency, hasCycle } from '../store/validation'
import type { FieldId, FieldName, IdConnection, NameConnection, NodeId, NodeName } from '../../types'
import { findFieldById, findFieldByName, getNodeMeta, parseIdConnection } from '../store/helpers'

export type InputOption = {
  value: IdConnection
  label: NameConnection
}

export type BaseFormData = {
  name: NodeName
  input?: IdConnection
  inputs?: Record<FieldName, IdConnection>
}

export function useNodeFormState(
  getFormInnerData: () => BaseFormData,
) {
  const {
    selectedNode,
    state,
    renameNode,
    getNodeById,
    addField: addFieldRaw,
    renameField: renameFieldRaw,
    removeField: removeFieldRaw,
    replaceConfig,
    disconnectEdge,
    connectEdge,
  } = useEditorStore()!

  const selectedNodeId = computed(() => selectedNode.value!.id)
  const isGlobalStateUpdating = ref(false)

  watch(state, async () => {
    isGlobalStateUpdating.value = true
    await nextTick()
    isGlobalStateUpdating.value = false
  }, { immediate: true, deep: true })

  // todo(zehao): debugging store api, remove later
  console.log('state', state.value)
  ; (window as any).store = useEditorStore()

  const formData = computed(() => {
    const edges = state.value.edges.filter(e => e.target === selectedNodeId.value)

    const inputsAndInput = edges.reduce<Pick<BaseFormData, 'input' | 'inputs'>>((acc, e) => {
      const sourceNode = getNodeById(e.source)!
      const sourceFieldId = findFieldById(sourceNode, 'output', e.sourceField)?.id
      const targetFieldName = findFieldById(selectedNode.value!, 'input', e.targetField)?.name
      const inputValue = sourceNode.id + (sourceFieldId ? `.${sourceFieldId}` : '') as IdConnection

      if (!targetFieldName) {
        acc.input = inputValue
      } else {
        acc.inputs = { ...acc.inputs, [targetFieldName]: inputValue }
      }
      return acc
    }, {})

    return {
      ...selectedNode.value!.config,
      ...inputsAndInput,
      name: selectedNode.value!.name,
    }
  })

  const setName = (name: string | null) => {
    if (isGlobalStateUpdating.value) return
    renameNode(selectedNodeId.value, name as NodeName ?? '')
  }

  const setConfig = () => {
    if (isGlobalStateUpdating.value) return
    const { name, input, inputs, ...config } = getFormInnerData()
    replaceConfig(selectedNodeId.value, config)
  }

  const addField = (
    io: 'input' | 'output',
    name: string,
  ) => {
    addFieldRaw(selectedNodeId.value, io, name as FieldName)
  }

  const renameField = (fieldId: FieldId, newName: string) => {
    renameFieldRaw(selectedNodeId.value, fieldId, newName as FieldName)
  }

  const removeField = (fieldId: FieldId) => {
    removeFieldRaw(selectedNodeId.value, fieldId)
  }

  const inputEdge = computed(() => {
    return state.value.edges.filter(e => e.target === selectedNodeId.value && !e.targetField)[0]
  })

  const inputsEdges = computed(() => {
    return state.value.edges.filter(e => e.target === selectedNodeId.value && e.targetField)
  })

  /**
   * Update the **input** connections for the selected node.
   * - If user clears the input field, remove the edge of the input field.
   * - If user sets a new input field, disconnect the input edge and the old input field edge,
   *   and add new edges for the input fields.
   */
  const setInputs = (fieldName: FieldName, fieldValue: IdConnection | null) => {
    if (isGlobalStateUpdating.value) return
    const clearing = fieldValue == null

    const fieldId = findFieldByName(selectedNode.value!, 'input', fieldName)?.id

    if (clearing) {
      // remove the edge of the input field
      const edge = inputsEdges.value.find(e => e.targetField === fieldId)
      if (edge) {
        disconnectEdge(edge.id, true)
      }
      return
    }

    // remove the input edge
    if (inputEdge.value) {
      disconnectEdge(inputEdge.value.id, false)
    }

    // remove the old input field edge
    const oldEdge = inputsEdges.value.find(e => e.targetField === fieldId)
    if (oldEdge) {
      disconnectEdge(oldEdge.id, false)
    }

    // add new edge for the input field
    const {
      nodeId: source,
      fieldId: sourceField,
    } = parseIdConnection(fieldValue)

    const targetFieldId = findFieldByName(selectedNode.value!, 'input', fieldName)!.id
    connectEdge({
      source,
      sourceField,
      target: selectedNodeId.value,
      targetField: targetFieldId,
    })
  }

  /**
   * Update the **input** connection for the selected node.
   * - If user clears the input, remove the edge of the input.
   * - If user sets a new input, disconnect existing edges and add new edge for the input.
   */
  const setInput = (value: IdConnection | null) => {
    if (isGlobalStateUpdating.value) return
    const clearing = value == null

    // remove existing edges
    for (const edge of [...inputsEdges.value, inputEdge.value].filter(Boolean)) {
      disconnectEdge(edge.id, clearing)
    }

    if (clearing) return

    // add new edge
    const { nodeId, fieldId } = parseIdConnection(value)
    connectEdge({
      source: nodeId,
      sourceField: fieldId,
      target: selectedNodeId.value,
      targetField: undefined, // input does not have a field
    })
  }

  const willCreateCycle = (sourceNode: NodeId): boolean => {
    const nextEdges: Array<{ source: NodeId, target: NodeId }> = [
      ...state.value.edges,
      { source: sourceNode, target: selectedNodeId.value },
    ]

    return hasCycle(buildAdjacency(nextEdges))
  }

  const inputOptions = computed<InputOption[]>(() => {
    const options: InputOption[] = []
    for (const node of state.value.nodes) {

      const meta = getNodeMeta(node.type)
      // skip no output nodes
      if (!meta.io?.output) continue

      // skip the node that no output fields and can't be configured
      if (!node.fields.output.length && !meta.io?.output?.configurable) continue

      // skip the selected node itself
      if (node.id === selectedNodeId.value) continue

      // skip the node that will create a cycle
      if (willCreateCycle(node.id)) continue

      options.push({ value: node.id, label: node.name })

      for (const field of node.fields.output) {
        options.push({
          value: `${node.id}.${field.id}`,
          label: `${node.name}.${field.name}`,
        })
      }
    }
    return options
  })

  return {
    // states
    formData,
    inputOptions,
    inputEdge,
    inputsEdges,

    // form ops
    setName,
    setConfig,

    // field ops
    addField,
    renameField,
    removeField,

    // input(s) ops
    setInputs,
    setInput,
  }
}

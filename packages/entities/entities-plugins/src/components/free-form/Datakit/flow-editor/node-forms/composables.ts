import { computed, nextTick, watch } from 'vue'
import { useEditorStore } from '../../composables'
import { buildAdjacency, hasCycle } from '../store/validation'
import type { EdgeInstance, FieldName, IdConnection, NameConnection, NodeId, NodeName } from '../../types'
import { findFieldById, findFieldByName, getNodeMeta, parseIdConnection } from '../store/helpers'

export type InputOption = {
  value: IdConnection
  label: NameConnection
}

export type BaseFormData = {
  name: NodeName
  input?: IdConnection
  inputs?: Record<FieldName, IdConnection | undefined | null>
}

export function useNodeForm<T extends BaseFormData = BaseFormData>(
  // It should return `T`, but we use any to avoid circular dependency issues
  getFormInnerData: () => any,
) {
  const {
    selectedNode,
    state,
    renameNode,
    getNodeById,
    addField: storeAddField,
    renameField: storeRenameField,
    removeField: storeRemoveField,
    replaceConfig,
    disconnectEdge,
    connectEdge,
  } = useEditorStore()

  const selectedNodeId = computed(() => selectedNode.value!.id)
  let isGlobalStateUpdating = false

  watch(state, async () => {
    isGlobalStateUpdating = true
    await nextTick()
    isGlobalStateUpdating = false
  }, { immediate: true, deep: true })

  // todo(zehao): debugging store api, remove later
  console.log('state', state.value)
  ;(window as any).store = useEditorStore()

  const formData = computed(() => {
    const edges = state.value.edges.filter(e => e.target === selectedNodeId.value)

    const inputsAndInput = edges.reduce<Pick<T, 'input' | 'inputs'>>((acc, e) => {
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

    // append user defined fields to inputs
    selectedNode.value?.fields.input.forEach(field => {
      if (!inputsAndInput.inputs) inputsAndInput.inputs = {}
      if (!inputsAndInput.inputs[field.name]) {
        inputsAndInput.inputs[field.name] = null
      }
    })

    return {
      ...selectedNode.value!.config,
      ...inputsAndInput,
      name: selectedNode.value!.name,
    } as T
  })

  const setName = (name: string | null) => {
    if (isGlobalStateUpdating) return
    renameNode(selectedNodeId.value, name as NodeName ?? '')
  }

  const setConfig = (commitNow = true) => {
    if (isGlobalStateUpdating) return
    const { name, input, inputs, ...config } = getFormInnerData() as T
    replaceConfig(selectedNodeId.value, config, commitNow)
  }

  const findFieldByNameOrThrow = (
    io: 'input' | 'output',
    name: FieldName,
  ) => {
    const field = findFieldByName(selectedNode.value!, io, name)
    if (!field) {
      throw new Error(`Field with name "${name}" not found in node "${selectedNode.value!.name}"`)
    }
    return field
  }

  const addField = (
    io: 'input' | 'output',
    name: FieldName,
    value?: IdConnection | null,
  ) => {
    const hasValue = !!value
    storeAddField(selectedNodeId.value, io, name, !hasValue)
    if (hasValue) {
      setInputs(name, value)
    }
  }

  const renameFieldByName = (
    io: 'input' | 'output',
    oldFieldName: FieldName,
    newFieldName: FieldName,
  ) => {
    if (isGlobalStateUpdating) return
    const fieldId = findFieldByNameOrThrow(io, oldFieldName).id
    storeRenameField(selectedNodeId.value, fieldId, newFieldName)
  }

  const removeFieldByName = (
    io: 'input' | 'output',
    fieldName: FieldName,
  ) => {
    const fieldId = findFieldByNameOrThrow(io, fieldName).id
    storeRemoveField(selectedNodeId.value, fieldId)
  }

  const inputEdge = computed<EdgeInstance | undefined>(() => {
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
    if (isGlobalStateUpdating) return
    const clearing = fieldValue == null

    const fieldId = findFieldByNameOrThrow('input', fieldName).id

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

    const targetFieldId = findFieldByNameOrThrow('input', fieldName).id
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
  const setInput = (value: IdConnection | null, commitNow = true) => {
    if (isGlobalStateUpdating) return
    const clearing = value == null

    // remove existing edges
    for (const edge of [...inputsEdges.value, inputEdge.value].filter(Boolean)) {
      disconnectEdge(edge!.id, commitNow && clearing)
    }

    if (clearing) return

    // add new edge
    const { nodeId, fieldId } = parseIdConnection(value)
    connectEdge({
      source: nodeId,
      sourceField: fieldId,
      target: selectedNodeId.value,
      targetField: undefined, // input does not have a field
    }, commitNow)
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
    renameFieldByName,
    removeFieldByName,

    // input(s) ops
    setInputs,
    setInput,
  }
}

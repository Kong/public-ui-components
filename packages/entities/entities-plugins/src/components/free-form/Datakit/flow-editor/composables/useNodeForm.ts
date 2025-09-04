import { computed, nextTick, watch } from 'vue'
import { useEditorStore } from '../../composables'
import { buildAdjacency, hasCycle } from '../store/validation'
import type { EdgeInstance, FieldName, IdConnection, NameConnection, NodeId, NodeName, NodeType } from '../../types'
import { findFieldById, findFieldByName, getNodeMeta, parseIdConnection } from '../store/helpers'
import { isReadableProperty } from '../node/property'
import { useFormShared } from '../../../shared/composables'
import type { ArrayLikeFieldSchema, RecordFieldSchema } from '../../../../../types/plugins/form-schema'
import { isImplicitType } from '../node/node'
import { ResponseSchema, ServiceRequestSchema } from '../node/schemas'
import { useFieldNameValidator, useNodeNameValidator } from './validation'
import { omit } from 'lodash-es'
import { useConfirm } from './useConflictConfirm'
import useI18n from '../../../../../composables/useI18n'
import type { ConnectionString } from '../modal/ConflictModal.vue'
import { createEdgeConnectionString, createNewConnectionString } from './helpers'

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
  nodeId: NodeId,
  // It should return `T`, but we use any to avoid circular dependency issues
  getFormInnerData?: () => any,
) {
  const {
    state,
    renameNode,
    getNodeById,
    addField: storeAddField,
    renameField: storeRenameField,
    removeField: storeRemoveField,
    replaceConfig,
    disconnectEdge,
    connectEdge,
    invalidConfigNodeIds,
    undo,
    commit,
  } = useEditorStore()

  const { i18n: { t } } = useI18n()
  const confirm = useConfirm()

  let isGlobalStateUpdating = false

  watch(state, async () => {
    isGlobalStateUpdating = true
    await nextTick()
    isGlobalStateUpdating = false
  }, { immediate: true, deep: true })

  // todo(zehao): debugging store api, remove later
  console.log('state', state.value)
  ;(window as any).store = useEditorStore()

  const currentNode = computed(() => {
    const node = getNodeById(nodeId)
    if (!node) throw new Error('Node not existed')
    return node
  })

  const formData = computed(() => {
    const edges = state.value.edges.filter(e => e.target === nodeId)

    const inputsAndInput = edges.reduce<Pick<T, 'input' | 'inputs'>>((acc, e) => {
      const sourceNode = getNodeById(e.source)!
      const sourceFieldId = findFieldById(sourceNode, 'output', e.sourceField)?.id
      const targetFieldName = findFieldById(currentNode.value, 'input', e.targetField)?.name
      const inputValue = sourceNode.id + (sourceFieldId ? `.${sourceFieldId}` : '') as IdConnection

      if (!targetFieldName) {
        acc.input = inputValue
      } else {
        acc.inputs = { ...acc.inputs, [targetFieldName]: inputValue }
      }
      return acc
    }, {})

    // append user defined fields to inputs
    currentNode.value.fields.input.forEach(field => {
      if (!inputsAndInput.inputs) inputsAndInput.inputs = {}
      if (!inputsAndInput.inputs[field.name]) {
        inputsAndInput.inputs[field.name] = null
      }
    })

    return {
      ...currentNode.value.config,
      ...inputsAndInput,
      name: currentNode.value.name,
    } as T
  })

  const setName = (name: string | null) => {
    renameNode(nodeId, name as NodeName ?? '', true, `${nodeId}:rename`)
  }

  /**
   * Set the configuration.
   * @param tag Set a tag to collapse the history. Using it in the input
   * prevents the user from generating too much history during typing.
   * @param commitNow Whether to commit the change immediately.
   */
  const setConfig = (tag?: string, commitNow = true) => {
    if (isGlobalStateUpdating) return
    if (!getFormInnerData) throw new Error('getFormInnerData is not defined')
    const config = omit(getFormInnerData(), ['name', 'input', 'inputs'])
    const finalTag = tag ? `update:${nodeId}:${tag}` : undefined
    replaceConfig(nodeId, config, commitNow, finalTag)
  }

  const findFieldByNameOrThrow = (
    io: 'input' | 'output',
    name: FieldName,
  ) => {
    const field = findFieldByName(currentNode.value, io, name)
    if (!field) {
      throw new Error(`Field with name "${name}" not found in node "${currentNode.value.name}"`)
    }
    return field
  }

  const addField = (
    io: 'input' | 'output',
    name: FieldName,
    value?: IdConnection | null,
  ) => {
    const hasValue = !!value
    storeAddField(nodeId, io, name, !hasValue)
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
    storeRenameField(nodeId, fieldId, newFieldName)
  }

  const removeFieldByName = (
    io: 'input' | 'output',
    fieldName: FieldName,
  ) => {
    const fieldId = findFieldByNameOrThrow(io, fieldName).id
    storeRemoveField(nodeId, fieldId)
  }

  const inputEdge = computed<EdgeInstance | undefined>(() => {
    return state.value.edges.filter(e => e.target === nodeId && !e.targetField)[0]
  })

  const inputsEdges = computed(() => {
    return state.value.edges.filter(e => e.target === nodeId && e.targetField)
  })

  /**
   * Update the **input** connections for the selected node.
   * - If user clears the input field, remove the edge of the input field.
   * - If user sets a new input field, disconnect the input edge and the old input field edge,
   *   and add new edges for the input fields.
   */
  const setInputs = async (fieldName: FieldName, fieldValue: IdConnection | null) => {
    if (isGlobalStateUpdating) return
    const clearing = fieldValue == null

    const fieldId = findFieldByNameOrThrow('input', fieldName).id

    if (clearing) {
      // remove the edge of the input field
      const edge = inputsEdges.value.find(e => e.targetField === fieldId)
      if (edge) {
        disconnectEdge(edge.id)
      }
      return
    }

    const {
      nodeId: source,
      fieldId: sourceField,
    } = parseIdConnection(fieldValue)

    const targetFieldId = findFieldByNameOrThrow('input', fieldName).id
    const removedConnections: ConnectionString[] = []

    // remove the input edge
    if (inputEdge.value) {
      removedConnections.push(createEdgeConnectionString(inputEdge.value, getNodeById))
      disconnectEdge(inputEdge.value.id, false)
    }

    // remove the old input field edge
    const oldEdge = inputsEdges.value.find(e => e.targetField === fieldId)
    if (oldEdge) {
      removedConnections.push(createEdgeConnectionString(oldEdge, getNodeById))
      disconnectEdge(oldEdge.id, false)
    }

    // add new edge for the input field
    connectEdge({
      source,
      sourceField,
      target: nodeId,
      targetField: targetFieldId,
    }, false)

    const addedConnection = createNewConnectionString(
      source,
      sourceField,
      nodeId,
      targetFieldId,
      getNodeById,
    )

    commit()


    // Check if the removed connection and the added connection refer to the same target field.
    // Here, [1] represents the target field name or identifier in the connection string tuple.
    const isReplace = removedConnections[0] && addedConnection
      ? removedConnections[0][1] === addedConnection[1]
      : false

    if (isReplace) return // The connection has been replaced, do nothing

    // Confirm the changes, undo if users not confirmed
    if (removedConnections.length > 0) {
      const confirmed = await confirm(
        t('plugins.free-form.datakit.flow_editor.confirm.message.switch'),
        [addedConnection],
        removedConnections,
      )

      if (!confirmed) {
        undo()
      }
    }
  }

  /**
   * Update the **input** connection for the selected node.
   * - If user clears the input, remove the edge of the input.
   * - If user sets a new input, disconnect existing edges and add new edge for the input.
   */
  const setInput = async (value: IdConnection | null) => {
    if (isGlobalStateUpdating) return
    const clearing = value == null

    if (clearing) {
      if (inputEdge.value) {
        disconnectEdge(inputEdge.value.id)
      }
      return
    }

    const removedConnections: ConnectionString[] = []

    // remove existing edges
    for (const edge of inputsEdges.value.concat(inputEdge.value ? [inputEdge.value] : [])) {
      removedConnections.push(createEdgeConnectionString(edge, getNodeById))
      disconnectEdge(edge!.id, false)
    }

    // add new edge
    const { nodeId: source, fieldId } = parseIdConnection(value)
    connectEdge({
      source,
      sourceField: fieldId,
      target: nodeId,
      targetField: undefined, // input does not have a field
    }, false)

    const addedConnection = createNewConnectionString(
      source,
      fieldId,
      nodeId,
      undefined,
      getNodeById,
    )

    commit()
    if (removedConnections.length > 0) {
      const confirmed = await confirm(
        t('plugins.free-form.datakit.flow_editor.confirm.message.switch'),
        [addedConnection],
        removedConnections,
      )

      if (!confirmed) {
        undo()
      }
    }
  }

  const willCreateCycle = (sourceNode: NodeId): boolean => {
    const nextEdges: Array<{ source: NodeId, target: NodeId }> = [
      ...state.value.edges,
      { source: sourceNode, target: nodeId },
    ]

    return hasCycle(buildAdjacency(nextEdges))
  }

  const inputOptions = computed<InputOption[]>(() => {
    const options: InputOption[] = []
    for (const node of state.value.nodes) {

      const meta = getNodeMeta(node.type)
      // skip no output nodes
      if (!meta.io?.output) continue

      // skip nodes that do not have output
      if (!node.fields.output) continue

      // skip the selected node itself
      if (node.id === nodeId) continue

      // skip property nodes that are not readable
      if (node.type === 'property' && !isReadableProperty(node.config?.property as string)) continue

      // skip the node that will create a cycle
      if (willCreateCycle(node.id)) continue

      // the nodes in request phase can not connect to response phase
      if (currentNode.value.phase === 'request' && node.phase === 'response') continue

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

  const inputsFieldNames = computed<FieldName[]>(() => {
    return currentNode.value.fields.input.map(f => f.name) || []
  })

  function toggleNodeValid(isValid: boolean) {
    invalidConfigNodeIds.value.delete(nodeId)
    if (!isValid) {
      invalidConfigNodeIds.value.add(nodeId)
    }
  }

  const validateFieldName = useFieldNameValidator(nodeId)

  function fieldNameValidator(
    io: 'input' | 'output',
    oldFieldName: FieldName,
    newFieldName: FieldName,
  ) {
    const node = getNodeById(nodeId)
    if (!node) throw new Error('Node not found when validating field name')
    const field = findFieldByName(node, io, oldFieldName)
    return validateFieldName(io, newFieldName, field?.id)
  }

  return {
    // states
    formData,
    inputOptions,
    inputEdge,
    inputsEdges,
    inputsFieldNames,
    currentNode,

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

    nameValidator: useNodeNameValidator(nodeId),
    fieldNameValidator,
    toggleNodeValid,
  }
}

export function useSubSchema(subSchemaName: Exclude<NodeType, 'request' | 'service_response'>) {
  const { getSchema } = useFormShared()
  return computed(() => {

    // Implicit nodes do not have schema, we hardcoded schemas for them
    if (isImplicitType(subSchemaName)) {
      switch (subSchemaName) {
        case 'response':
          return ResponseSchema
        case 'service_request':
          return ServiceRequestSchema
      }
    }

    try {
      const schema = getSchema()
      const configSchema = schema.fields[0].config as RecordFieldSchema
      const configFields = configSchema.fields[0].nodes as ArrayLikeFieldSchema
      const elements = configFields.elements as RecordFieldSchema
      const subSchema = elements.subschema_definitions![subSchemaName]
      if (!subSchema) throw new Error(`Subschema "${subSchemaName}" not found in the schema.`)
      return subSchema
    } catch (e) {
      throw new Error(`Failed to get subschema "${subSchemaName}": ${(e as Error).message}`)
    }
  })
}

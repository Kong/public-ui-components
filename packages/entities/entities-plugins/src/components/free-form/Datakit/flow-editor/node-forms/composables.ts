import { computed } from 'vue'
import { useEditorState } from '../store/store'
import type { BaseConfigNode, EdgeData, FieldId, FieldName, IdConnection, NameConnection, NodeId, NodeName } from '../../types'
import { findFieldById, findFieldByName, parseIdConnection, parseNameConnection } from '../store/helpers'

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
    replaceConnection,
  } = useEditorState()!

  const selectedNodeId = computed(() => selectedNode.value!.id)

  // todo(zehao): remove me!
  console.log('state', state.value)
  ; (window as any).store = useEditorState()

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

  const updateName = (name: string | null) => {
    console.log('updateName', name)
    renameNode(selectedNodeId.value, name as NodeName ?? '')
  }

  const updateConfiguration = () => {
    const { name, input, inputs, ...config } = getFormInnerData()
    console.log('updateConfiguration', config)
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

  const updateInputs = (fieldName: FieldName) => {
    const { input, inputs } = getFormInnerData()
    console.log('updateInputs', { input, inputs })
    console.log('fieldName', fieldName)

    const clearing = inputs![fieldName] == null

    // clear the input anyway
    if (input) {
      const {
        nodeId: sourceNodeId,
        fieldId: sourceFieldId,
      } = parseIdConnection(input)

      const inputEdge = state.value.edges.find(e =>
        e.target === selectedNodeId.value &&
        e.source === sourceNodeId &&
        e.sourceField === sourceFieldId,
      )

      if (inputEdge) {
        disconnectEdge(inputEdge.id, false)
      }
    }

    if (clearing) {
      const targetFieldId = findFieldByName(selectedNode.value!, 'input', fieldName)!.id
      // todo
    }
  }

  const updateInput = () => {
    const { input: nextInput } = getFormInnerData()
    const edges = state.value.edges.filter(e => e.target === selectedNodeId.value)
    const clearing = nextInput == null

    // clear existing edges
    edges.forEach(edge => {
      // if user is clearing the input, commit the change
      disconnectEdge(edge.id, clearing)
    })

    // connect the new input
    if (nextInput) {
      const [sourceNodeId, sourceFieldId] = nextInput.split('.')

      // prepare new edge data
      const edgeData: EdgeData = {
        source: sourceNodeId as NodeId,
        sourceField: sourceFieldId as FieldId | undefined,
        target: selectedNodeId.value,
        targetField: undefined,
      }

      connectEdge(edgeData)
    }
  }

  /**
   * todo(zehao):
   * 1. skip no output/outputs nodes
   * 2. skip the nodes that will creating circle
   */
  const inputOptions = computed<InputOption[]>(() => {
    const options: InputOption[] = []
    for (const node of state.value.nodes) {
      if (node.id === selectedNodeId.value) continue
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

  console.log('formData', formData.value)
  console.log('inputOptions', inputOptions.value)

  return {
    formData,
    inputOptions,

    updateName,
    updateConfiguration,

    addField,
    renameField,
    removeField,

    updateInputs,
    updateInput,
  }
}

import { computed } from 'vue'
import { useEditorState } from '../store/store'
import type { BaseConfigNode, FieldId, FieldName, NodeId, NodeName } from '../../types'
import { findFieldById } from '../store/helpers'

export type InputOption = {
  value: NodeId | `${NodeId}.${FieldId}`
  label: NodeName | `${NodeName}.${FieldName}`
}

export function useNodeFormState(
  getFormInnerData: () => Record<string, unknown>,
) {
  /**
   * formData

   * updateName
   * updateConfiguration

   * addField
   * removeField
   * renameField
   * updateInputs
   * 1. 新增 input -> connectEdge
      2. 新增 input 并清空 inputs -> replaceConnection
      3. 新增 inputs -> connectEdge
      4. 新增 inputs 并清空 input -> replaceConnection
      5. 变更 input -> replaceConnection
      6. 变更 inputs -> replaceConnection
      7. 删除 input -> disconnectEdge
      8. 删除 inputs -> disconnectEdge
   */

  const {
    selectedNode,
    state,
    renameNode,
    getNodeById,
    addField: addFieldRaw,
    renameField: renameFieldRaw,
    removeField: removeFieldRaw,
    replaceConfig,
  } = useEditorState()!

  const selectedNodeId = computed(() => selectedNode.value!.id)

  // todo(zehao): remove me!
  console.log('state', state.value)
  ; (window as any).store = useEditorState()

  const formData = computed(() => {
    const edges = state.value.edges.filter(e => e.target === selectedNodeId.value)

    const inputsAndInput = edges.reduce<Pick<BaseConfigNode, 'input' | 'inputs'>>((acc, e) => {
      const sourceNode = getNodeById(e.source)!
      const sourceFieldId = findFieldById(sourceNode, 'output', e.sourceField)?.id
      const targetFieldName = findFieldById(selectedNode.value!, 'input', e.targetField)?.name
      const inputValue = sourceNode.id + (sourceFieldId ? `.${sourceFieldId}` : '')

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

  const updateInputs = () => {
    const { input, inputs } = getFormInnerData()
    console.log('updateInputs', { input, inputs })
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
  }
}

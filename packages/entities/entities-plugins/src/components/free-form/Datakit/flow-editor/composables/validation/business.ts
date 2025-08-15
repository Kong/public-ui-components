import useI18n from '../../../../../../composables/useI18n'
import { useEditorStore } from '../../../composables'
import type { FieldId, FieldName, NodeId, NodeInstance } from '../../../types'
import type { ValidatorFn } from './basic'
import { compose, notEmpty, stringFormat } from './basic'

export function isUniqueNodeName(
  nodeId: NodeId,
  templateVarOrString?: string | { fieldName: string },
): ValidatorFn<string> {
  const { state } = useEditorStore()
  const { i18n: { t } } = useI18n()

  return function validateIsUniqueNodeName(value: string): undefined | string {
    if (state.value.nodes.some(n => n.name === value && n.id !== nodeId)) {
      const getErrorMessage = () => {
        if (!templateVarOrString) return 'Name must be unique.'
        if (typeof templateVarOrString === 'string') return templateVarOrString
        return t('plugins.free-form.datakit.flow_editor.node_properties.errors.not_unique', templateVarOrString)
      }
      return getErrorMessage()
    }
    return undefined
  }
}

export function isUniqueFieldName(
  io: 'input' | 'output',
  node?: NodeInstance,
  fieldId?: FieldId,
): ValidatorFn<FieldName> {
  const { i18n: { t } } = useI18n()

  return function validateIsUniqueFieldName(value: FieldName): undefined | string {
    if (!node) return undefined

    const duplicate = fieldId
      // for existing field
      ? node.fields[io].some(f => f.name === value && f.id !== fieldId)
      // for new field
      : node.fields[io].some(f => f.name === value)

    if (duplicate) {
      const fieldName = io === 'input'
        ? t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label')
        : t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value_name')
      return t('plugins.free-form.datakit.flow_editor.node_properties.errors.not_unique', { fieldName })
    }

    return undefined
  }
}

export function useNodeNameValidator(nodeId: NodeId): ValidatorFn<string> {
  const { i18n: { t } } = useI18n()
  const errTempVars = { fieldName: t('plugins.free-form.datakit.flow_editor.node_properties.name') }
  return compose(
    notEmpty(errTempVars),
    stringFormat('identifier', errTempVars),
    isUniqueNodeName(nodeId, errTempVars),
  )
}

export function useFieldNameValidator(nodeId: NodeId) {
  const { i18n: { t } } = useI18n()
  const { getNodeById } = useEditorStore()

  return function validateFieldName(io: 'input' | 'output', fieldName: FieldName, fieldId?: FieldId) {
    const errTempVars = {
      fieldName: io === 'input'
        ? t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label')
        : t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value_name'),
    }
    return compose(
      notEmpty(errTempVars),
      stringFormat('identifier', errTempVars),
      isUniqueFieldName(io, getNodeById(nodeId), fieldId),
    )(fieldName)
  }
}

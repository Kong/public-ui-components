import useI18n from '../../../../../composables/useI18n'
import { useEditorStore } from '../../composables'

export function useNameValidator() {
  const {
    selectedNode,
    state,
  } = useEditorStore()

  const { i18n: { t } } = useI18n()

  function validator(name: string): true | string {
    if (!name) return t('plugins.free-form.datakit.flow_editor.node_properties.errors.name_empty')
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name)) {
      return t('plugins.free-form.datakit.flow_editor.node_properties.errors.name_format')
    }
    if (state.value.nodes.some(n => n.name === name && n.id !== selectedNode.value!.id)) {
      return t('plugins.free-form.datakit.flow_editor.node_properties.errors.name_duplicate', { name })
    }
    return true
  }

  return validator
}

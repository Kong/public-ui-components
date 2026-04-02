import KeyValueField from '../../shared/KeyValueField.vue'
import type { PluginFormConfig } from '../../shared/define-plugin-config'

export const logConfig: PluginFormConfig = {
  fieldRenderers: [
    {
      match: 'config.custom_fields_by_lua',
      component: KeyValueField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
}

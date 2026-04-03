import { definePluginConfig } from '../shared/define-plugin-config'
import KeyValueField from '../shared/KeyValueField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.custom_fields_by_lua',
      component: KeyValueField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

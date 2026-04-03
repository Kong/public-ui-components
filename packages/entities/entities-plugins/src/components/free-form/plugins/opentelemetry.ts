import KeyValueField from '../shared/KeyValueField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.access_logs.custom_attributes_by_lua',
      component: KeyValueField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

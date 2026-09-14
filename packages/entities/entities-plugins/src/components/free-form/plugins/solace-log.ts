import { definePluginConfig } from '../define-plugin-config'
import MapField from '../core/components/MapField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.message.custom_fields_by_lua',
      component: MapField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

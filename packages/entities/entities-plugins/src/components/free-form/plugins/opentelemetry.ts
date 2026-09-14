import MapField from '../core/components/MapField.vue'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.access_logs.custom_attributes_by_lua',
      component: MapField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

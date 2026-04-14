import { definePluginConfig } from '../shared/define-plugin-config'
import MapField from '../shared/MapField.vue'

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

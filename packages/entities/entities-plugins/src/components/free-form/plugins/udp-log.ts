import { definePluginConfig } from '../define-plugin-config'
import { MapField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.custom_fields_by_lua',
      component: MapField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

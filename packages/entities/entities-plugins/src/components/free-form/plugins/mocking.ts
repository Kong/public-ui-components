import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.api_specification',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 15,
      },
    },
  ],
})

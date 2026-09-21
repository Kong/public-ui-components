import { definePluginConfig } from '../define-plugin-config'
import { StringField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.message.functions.*',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 3,
      },
    },
  ],
})

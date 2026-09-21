import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path }) => path === 'config.request_jq_program' || path === 'config.response_jq_program',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

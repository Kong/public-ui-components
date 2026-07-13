import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ genericPath }) => [
        'config.access.*',
        'config.body_filter.*',
        'config.header_filter.*',
        'config.certificate.*',
        'config.functions.*',
        'config.log.*',
        'config.rewrite.*',
        'config.ws_handshake.*',
        'config.ws_client_frame.*',
        'config.ws_upstream_frame.*',
        'config.ws_close.*',
      ].includes(genericPath),
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 3,
      },
    },
  ],
})

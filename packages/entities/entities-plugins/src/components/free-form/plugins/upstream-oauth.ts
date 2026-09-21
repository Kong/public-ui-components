import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.cache.strategy', 'config.cache.redis'],
    ],
    dependencies: {
      'config.cache.redis': ['config.cache.strategy', 'redis'],
    },
  },
  fieldRenderers: [
    {
      match: 'config.behavior.idp_error_response_body_template',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

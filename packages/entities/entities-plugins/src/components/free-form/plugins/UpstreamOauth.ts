import StringField from '../shared/StringField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

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
      },
    },
  ],
})

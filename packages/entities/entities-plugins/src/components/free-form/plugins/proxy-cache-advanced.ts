import { definePluginConfig } from '../shared/define-plugin-config'
import EnumField from '../shared/EnumField.vue'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.strategy', 'config.redis'],
    ],
    dependencies: {
      'config.redis': ['config.strategy', 'redis'],
    },
  },
  fieldRenderers: [
    {
      match: ({ path }) => {
        return path === 'config.methods' || path === 'config.request_method'
      },
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

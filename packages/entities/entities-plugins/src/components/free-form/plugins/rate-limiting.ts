import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.policy', 'config.redis'],
    ],
    dependencies: {
      'config.redis': ['config.policy', 'redis'],
    },
  },
})

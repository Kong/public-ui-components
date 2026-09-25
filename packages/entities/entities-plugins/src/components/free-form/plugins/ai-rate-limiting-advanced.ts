import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  renderRules: {
    bundles: [
      ['config.strategy', 'config.redis'],
    ],
    dependencies: {
      'config.redis': ['config.strategy', 'redis'],
    },
  },
})

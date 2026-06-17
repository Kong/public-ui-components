import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.vectordb.strategy', 'config.vectordb.redis'],
    ],
    dependencies: {
      'config.vectordb.redis': ['config.vectordb.strategy', 'redis'],
    },
  },
})

import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.vectordb.strategy', 'config.vectordb.redis', 'config.vectordb.pgvector'],
    ],
    dependencies: {
      'config.vectordb.redis': ['config.vectordb.strategy', 'redis'],
      'config.vectordb.pgvector': ['config.vectordb.strategy', 'pgvector'],
    },
  },
})

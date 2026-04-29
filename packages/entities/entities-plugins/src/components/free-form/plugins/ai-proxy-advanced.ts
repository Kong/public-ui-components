import { definePluginConfig } from '../shared/define-plugin-config'
import EnumField from '../shared/EnumField.vue'

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
  fieldRenderers: [
    {
      match: 'config.balancer.failover_criteria',
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

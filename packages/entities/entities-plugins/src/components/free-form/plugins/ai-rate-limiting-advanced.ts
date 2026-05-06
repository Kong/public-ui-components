import StringField from '../shared/StringField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

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
      match: 'config.request_prompt_count_function',
      component: StringField,
      propsOverrides: { multiline: true, rows: 4 },
    },
    {
      match: 'config.custom_cost_count_function',
      component: StringField,
      propsOverrides: { multiline: true, rows: 4 },
    },
  ],
})

import StringField from '../shared/StringField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'
import { vectordbFieldRenderers, vectordbRenderRules } from './_shared/vectordb'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    ...vectordbFieldRenderers,
    {
      match: 'config.rules.allow_responses.*',
      component: StringField,
      propsOverrides: { multiline: true, rows: 2 },
    },
    {
      match: 'config.rules.deny_responses.*',
      component: StringField,
      propsOverrides: { multiline: true, rows: 2 },
    },
  ],
  renderRules: vectordbRenderRules,
})

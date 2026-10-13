import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'
import { vectordbFieldRenderers, vectordbRenderRules } from './_shared/vectordb'

export default definePluginConfig({
  fieldRenderers: [
    ...vectordbFieldRenderers,
    {
      match: 'config.rules.allow_prompts.*',
      component: StringField,
      propsOverrides: { multiline: true, rows: 2 },
    },
    {
      match: 'config.rules.deny_prompts.*',
      component: StringField,
      propsOverrides: { multiline: true, rows: 2 },
    },
  ],
  renderRules: vectordbRenderRules,
})

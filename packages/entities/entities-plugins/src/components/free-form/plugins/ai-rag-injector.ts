import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'
import { vectordbFieldRenderers, vectordbRenderRules } from './_shared/vectordb'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    ...vectordbFieldRenderers,
    {
      match: 'config.inject_template',
      component: StringField,
      propsOverrides: { multiline: true, rows: 8 },
    },
  ],
  renderRules: vectordbRenderRules,
})

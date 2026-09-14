import { definePluginConfig } from '../define-plugin-config'
import { StringField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.prompts.prepend.*.content',
      component: StringField,
      propsOverrides: { multiline: true, rows: 4 },
    },
    {
      match: 'config.prompts.append.*.content',
      component: StringField,
      propsOverrides: { multiline: true, rows: 4 },
    },
  ],
})

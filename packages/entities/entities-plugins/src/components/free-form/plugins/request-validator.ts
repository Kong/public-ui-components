import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.body_schema',
      component: StringField,
      propsOverrides: { multiline: true, rows: 4 },
    },
    {
      match: 'config.parameter_schema.*.schema',
      component: StringField,
      propsOverrides: { multiline: true, rows: 2 },
    },
  ],
})

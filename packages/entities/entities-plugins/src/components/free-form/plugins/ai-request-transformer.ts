import StringField from '../shared/StringField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.prompt',
      component: StringField,
      propsOverrides: { multiline: true, rows: 6 },
    },
  ],
})

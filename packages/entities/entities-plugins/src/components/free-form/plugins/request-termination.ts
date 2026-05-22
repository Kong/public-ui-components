import StringField from '../shared/StringField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.body',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

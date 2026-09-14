import { definePluginConfig } from '../define-plugin-config'
import StringField from '../core/components/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.api_spec',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 15,
      },
    },
  ],
})

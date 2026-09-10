import StringField from '../core/components/StringField.vue'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.api_specification',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 15,
      },
    },
  ],
})

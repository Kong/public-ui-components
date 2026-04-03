import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path }) => (
        path === 'config.replace.body' ||
          /^config\.transform\.functions\.\d+$/.test(path) ||
          /\.json\.\d+$/.test(path)
      ),
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 3,
      },
    },
  ],
})

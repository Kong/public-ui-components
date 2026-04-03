import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path, genericPath }) => (
        path === 'config.replace.body' ||
        genericPath === 'config.transform.functions.*' ||
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

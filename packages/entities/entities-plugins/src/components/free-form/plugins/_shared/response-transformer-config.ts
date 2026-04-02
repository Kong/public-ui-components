import StringField from '../../shared/StringField.vue'
import type { PluginFormConfig } from '../../shared/define-plugin-config'

export const responseTransformerConfig: PluginFormConfig = {
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
}

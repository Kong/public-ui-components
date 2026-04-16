import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ genericPath }) => genericPath === 'config.functions.*',
      component: StringField,
      propsOverrides: (props) => ({
        ...props,
        multiline: true,
        rows: 3,
      }),
    },
  ],
})

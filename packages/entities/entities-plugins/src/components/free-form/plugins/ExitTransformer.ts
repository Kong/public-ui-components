import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path }) => /^config.functions.\d$/.test(path),
      component: StringField,
      propsOverrides: (props) => ({
        ...props,
        multiline: true,
        rows: 3,
      }),
    },
  ],
})

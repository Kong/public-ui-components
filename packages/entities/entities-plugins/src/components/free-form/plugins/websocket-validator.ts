import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path }) => [
        'config.client.text.schema',
        'config.client.binary.schema',
        'config.upstream.text.schema',
        'config.upstream.binary.schema',
      ].includes(path),
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

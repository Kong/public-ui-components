import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: ({ path }) => /^config\.(client|upstream)\.(text|binary)\.schema$/.test(path),
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

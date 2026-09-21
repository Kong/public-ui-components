import { definePluginConfig } from '../define-plugin-config'
import { StringField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path, genericPath }) => (
        path === 'config.replace.body' ||
        genericPath === 'config.transform.functions.*' ||
        genericPath.endsWith('.json.*')
      ),
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 3,
      },
    },
  ],
})

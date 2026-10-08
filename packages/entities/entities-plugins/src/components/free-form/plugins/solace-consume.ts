import { definePluginConfig } from '../define-plugin-config'
import { StringField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: ({ genericPath }) => genericPath === 'config.flow.functions.*',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 3,
      },
    },
  ],
})

import { definePluginConfig } from '../define-plugin-config'
import { StringField } from '@kong-ui-public/freeform'

export default definePluginConfig({
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

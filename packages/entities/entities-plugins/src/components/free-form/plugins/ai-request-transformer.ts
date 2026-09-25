import { definePluginConfig } from '../define-plugin-config'
import { StringField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: 'config.prompt',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

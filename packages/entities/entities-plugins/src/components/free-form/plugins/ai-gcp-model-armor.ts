import { StringField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: 'config.gcp_service_account_json',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

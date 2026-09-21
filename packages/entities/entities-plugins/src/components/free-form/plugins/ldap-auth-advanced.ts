import { EnumField } from '@kong-ui-public/freeform'
import { definePluginConfig } from '../define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.consumer_by',
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

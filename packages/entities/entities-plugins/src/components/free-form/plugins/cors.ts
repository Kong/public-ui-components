import { definePluginConfig } from '../define-plugin-config'
import { EnumField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: ({ path }) => {
        return path === 'config.methods' || path === 'config.request_method'
      },
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

import { definePluginConfig } from '../define-plugin-config'
import EnumField from '../core/components/EnumField.vue'

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

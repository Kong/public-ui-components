import { definePluginConfig } from '../shared/define-plugin-config'
import EnumField from '../shared/EnumField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.injection_types',
      component: EnumField,
      propsOverrides: { multiple: true },
    },
    {
      match: 'config.locations',
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

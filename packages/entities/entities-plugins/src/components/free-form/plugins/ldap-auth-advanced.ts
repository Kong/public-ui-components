import EnumField from '../shared/EnumField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

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

import { definePluginConfig } from '../shared/define-plugin-config'
import EnumField from '../shared/EnumField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.anonymize',
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

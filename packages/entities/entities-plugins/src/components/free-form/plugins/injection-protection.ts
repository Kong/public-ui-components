import { definePluginConfig } from '../shared/define-plugin-config'
import EnumField from '../shared/EnumField.vue'
import ArrayField from '../shared/ArrayField.vue'

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
    {
      match: 'config.custom_injections',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Injection`,
      },
    },
  ],
})

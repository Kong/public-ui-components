import { definePluginConfig } from '../define-plugin-config'
import { EnumField, ArrayField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.anonymize',
      component: EnumField,
      propsOverrides: { multiple: true },
    },

    {
      match: 'config.custom_patterns',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Pattern`,
      },
    },
  ],
})

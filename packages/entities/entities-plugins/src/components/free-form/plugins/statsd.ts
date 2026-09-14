import { definePluginConfig } from '../define-plugin-config'
import ArrayField from '../core/components/ArrayField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.metrics',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Metric`,
      },
    },
  ],
})

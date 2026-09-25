import { definePluginConfig } from '../define-plugin-config'
import { ArrayField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: 'config.compression_ranges',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Range`,
      },
    },
  ],
})

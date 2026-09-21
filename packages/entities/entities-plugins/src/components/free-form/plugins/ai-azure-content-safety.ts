import { definePluginConfig } from '../define-plugin-config'
import { ArrayField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.categories',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Category`,
      },
    },
  ],
})

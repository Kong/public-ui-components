import { definePluginConfig } from '../define-plugin-config'
import ArrayField from '../core/components/ArrayField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.targets',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `#${index + 1} Target`,
      },
    },

    {
      match: 'config.acls.allow',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Allow`,
      },
    },

    {
      match: ({ genericPath }) => [
        'config.acls.allow.*.match',
        'config.acls.deny.*.match',
      ].includes(genericPath),
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Match`,
      },
    },

    {
      match: 'config.acls.deny',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `#${index + 1} Deny`,
      },
    },
  ],
})

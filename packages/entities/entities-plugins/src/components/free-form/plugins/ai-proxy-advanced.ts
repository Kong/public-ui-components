import { definePluginConfig } from '../shared/define-plugin-config'
import ArrayField from '../shared/ArrayField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.targets',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `Target #${index + 1}`,
      },
    },

    {
      match: 'config.acls.allow',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `Allow #${index + 1}`,
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
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `Match #${index + 1}`,
      },
    },

    {
      match: 'config.acls.deny',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `Deny #${index + 1}`,
      },
    },
  ],
})

import { definePluginConfig } from '../define-plugin-config'
import { StringField, ArrayField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.message_by_lua_functions.*',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 3,
      },
    },

    {
      match: 'config.topics',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        stickyTabs: true,
        itemLabel: (_: unknown, index: number) => `#${index + 1} Topic`,
      },
    },

    {
      match: 'config.bootstrap_servers',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Server`,
      },
    },
  ],
})

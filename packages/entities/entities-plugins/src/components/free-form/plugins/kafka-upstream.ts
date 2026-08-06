import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'
import ArrayField from '../shared/ArrayField.vue'

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
      match: 'config.bootstrap_servers',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Server`,
      },
    },
  ],
})

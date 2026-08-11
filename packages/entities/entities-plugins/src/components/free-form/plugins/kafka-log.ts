import { definePluginConfig } from '../shared/define-plugin-config'
import MapField from '../shared/MapField.vue'
import ArrayField from '../shared/ArrayField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.custom_fields_by_lua',
      component: MapField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
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

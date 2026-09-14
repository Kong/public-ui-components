import { definePluginConfig } from '../define-plugin-config'
import MapField from '../core/components/MapField.vue'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: 'config.functions',
      component: MapField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

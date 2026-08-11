import { definePluginConfig } from '../shared/define-plugin-config'
import MapField from '../shared/MapField.vue'

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

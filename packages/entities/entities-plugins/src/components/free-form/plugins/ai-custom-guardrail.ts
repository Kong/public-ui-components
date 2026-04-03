import { definePluginConfig } from '../shared/define-plugin-config'
import KeyValueField from '../shared/KeyValueField.vue'

export default definePluginConfig({
  fieldRenderers: [
    {
      match: 'config.functions',
      component: KeyValueField,
      propsOverrides: {
        appearance: { string: { multiline: true } },
      },
    },
  ],
})

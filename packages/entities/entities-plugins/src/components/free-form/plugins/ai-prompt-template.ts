import StringField from '../shared/StringField.vue'
import ArrayField from '../shared/ArrayField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.templates',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Template`,
      },
    },

    {
      match: ({ genericPath }) => genericPath === 'config.templates.*.template',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

import { definePluginConfig } from '../shared/define-plugin-config'
import StringField from '../shared/StringField.vue'
import ArrayField from '../shared/ArrayField.vue'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: [
    {
      match: 'config.parameter_schema',
      component: ArrayField as any,
      propsOverrides: {
        appearance: 'tabs',
        itemLabel: (_: unknown, index: number) => `#${index + 1} Parameter schema`,
      },
    },
    {
      match: 'config.body_schema',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
    {
      match: 'config.parameter_schema.*.schema',
      component: StringField,
      propsOverrides: {
        multiline: true,
        rows: 4,
      },
    },
  ],
})

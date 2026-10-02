import { definePluginConfig } from '../define-plugin-config'
import { EnumField } from '@kong-ui-public/freeform'

export default definePluginConfig({
  renderRules: {
    bundles: [
      ['config.strategy', 'config.redis'],
    ],
    dependencies: {
      'config.redis': ['config.strategy', 'redis'],
    },
  },
  fieldRenderers: [
    {
      match: ({ path }) => {
        return path === 'config.methods' || path === 'config.request_method'
      },
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

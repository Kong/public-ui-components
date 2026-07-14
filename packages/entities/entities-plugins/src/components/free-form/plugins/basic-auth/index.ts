import ConfigFormWithIdentity from '../../../fields/kong-identity/ConfigFormWithIdentity.vue'
import StringField from '../../shared/StringField.vue'
import { definePluginConfig } from '../../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  component: ConfigFormWithIdentity,
  renderRules: {
    dependencies: {
      'config.brute_force_protection.redis': ['config.brute_force_protection.strategy', 'redis'],
    },
  },
  fieldRenderers: [
    {
      match: 'config.anonymous',
      component: StringField,
      propsOverrides: {
        placeholder: 'e.g., 00000000-0000-0000-0000-000000000001',
      },
    },
  ],
})

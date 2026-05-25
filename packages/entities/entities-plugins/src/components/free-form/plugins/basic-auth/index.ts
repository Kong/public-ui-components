import ConfigFormWithIdentity from '../../../fields/kong-identity/ConfigFormWithIdentity.vue'
import { definePluginConfig } from '../../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  component: ConfigFormWithIdentity,
  renderRules: {
    dependencies: {
      'config.brute_force_protection.redis': ['config.brute_force_protection.strategy', 'redis'],
    },
  },
})

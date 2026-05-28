import { definePluginConfig } from '../../shared/define-plugin-config'
import JwtSignerForm from './JwtSignerForm.vue'

export default definePluginConfig({
  component: JwtSignerForm,
  renderRules: {
    bundles: [
      // Hoist signing + upstream_header before keyset so the dynamic
      // URL-validation error on keyset is visible alongside its preconditions.
      ['config.access_token_signing', 'config.access_token_upstream_header', 'config.access_token_keyset'],
      ['config.channel_token_signing', 'config.channel_token_upstream_header', 'config.channel_token_keyset'],
    ],
  },
})

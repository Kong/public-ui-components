import EnumField from '../shared/EnumField.vue'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  renderRules: {
    bundles: [
      ['config.session_storage', 'config.redis'],
      ['config.cluster_cache_strategy', 'config.cluster_cache_redis'],
    ],
    dependencies: {
      'config.redis': ['config.session_storage', 'redis'],
      'config.cluster_cache_redis': ['config.cluster_cache_strategy', 'redis'],
    },
  },
  fieldRenderers: [
    {
      match: ({ path }) => [
        'config.auth_methods',
        'config.client_auth',
        'config.client_alg',
        'config.token_headers_grants',
        'config.bearer_token_param_type',
        'config.client_credentials_param_type',
        'config.password_param_type',
        'config.id_token_param_type',
        'config.refresh_token_param_type',
        'config.login_methods',
        'config.login_tokens',
        'config.logout_methods',
        'config.consumer_by',
        'config.ignore_signature',
        'config.disable_session',
      ].includes(path),
      component: EnumField,
      propsOverrides: { multiple: true },
    },
  ],
})

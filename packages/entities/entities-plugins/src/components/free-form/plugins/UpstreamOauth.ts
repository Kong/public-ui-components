import UpstreamOauthForm from '../UpstreamOauth'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  component: UpstreamOauthForm,
  renderRules: {
    bundles: [
      ['config.cache.strategy', 'config.cache.redis'],
    ],
    dependencies: {
      'config.cache.redis': ['config.cache.strategy', 'redis'],
    },
  },
})

import { logConfig } from './_shared/log-config'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  ...logConfig,
  experimental: true,
})

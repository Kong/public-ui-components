import { responseTransformerConfig } from './_shared/response-transformer-config'
import { definePluginConfig } from '../shared/define-plugin-config'

export default definePluginConfig({
  ...responseTransformerConfig,
  experimental: true,
})

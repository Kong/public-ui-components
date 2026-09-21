import { definePluginConfig } from '../define-plugin-config'
import { vectordbFieldRenderers, vectordbRenderRules } from './_shared/vectordb'

export default definePluginConfig({
  experimental: true,
  fieldRenderers: vectordbFieldRenderers,
  renderRules: vectordbRenderRules,
})

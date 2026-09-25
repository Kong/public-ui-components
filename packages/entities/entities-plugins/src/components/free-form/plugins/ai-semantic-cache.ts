import { definePluginConfig } from '../define-plugin-config'
import { vectordbFieldRenderers, vectordbRenderRules } from './_shared/vectordb'

export default definePluginConfig({
  fieldRenderers: vectordbFieldRenderers,
  renderRules: vectordbRenderRules,
})

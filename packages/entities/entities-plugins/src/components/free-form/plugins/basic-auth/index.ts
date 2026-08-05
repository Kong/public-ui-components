import ConfigFormWithIdentity from '../../../fields/kong-identity/ConfigFormWithIdentity.vue'
import { definePluginConfig } from '../../shared/define-plugin-config'

// Render rules and field renderers live inside ConfigFormWithIdentity.
export default definePluginConfig({
  experimental: true,
  component: ConfigFormWithIdentity,
})

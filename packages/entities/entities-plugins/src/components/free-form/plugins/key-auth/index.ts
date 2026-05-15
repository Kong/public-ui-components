import ConfigFormWithIdentity from '../../../fields/kong-identity/ConfigFormWithIdentity.vue'
import IdentityRealmsField from './IdentityRealmsField.vue'
import { definePluginConfig } from '../../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  component: ConfigFormWithIdentity,
  fieldRenderers: [
    {
      match: ({ path }) => path === 'config.identity_realms',
      component: IdentityRealmsField,
    },
  ],
})

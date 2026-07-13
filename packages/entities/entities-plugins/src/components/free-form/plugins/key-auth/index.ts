import ConfigFormWithIdentity from '../../../fields/kong-identity/ConfigFormWithIdentity.vue'
import IdentityRealmsField from './IdentityRealmsField.vue'
import StringField from '../../shared/StringField.vue'
import { definePluginConfig } from '../../shared/define-plugin-config'

export default definePluginConfig({
  experimental: true,
  component: ConfigFormWithIdentity,
  fieldRenderers: [
    {
      match: ({ path }) => path === 'config.identity_realms',
      component: IdentityRealmsField,
    },
    {
      match: 'config.anonymous',
      component: StringField,
      propsOverrides: {
        placeholder: 'e.g., 00000000-0000-0000-0000-000000000001',
      },
    },
    {
      match: 'config.realm',
      component: StringField,
      propsOverrides: {
        placeholder: 'e.g., my-api',
      },
    },
  ],
})

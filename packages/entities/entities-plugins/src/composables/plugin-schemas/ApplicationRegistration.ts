import typedefs from './typedefs'
import type { AppRegFormSchema } from '../../types/plugins/application-registration-schema'

// Note: unlike most plugin schemas this schema is not modify the config fields,
// but rather the defaultFormSchema set in pages/Plugins/Form.vue
export const applicationRegistrationSchema: AppRegFormSchema = {
  enabled: {
    type: 'switch',
    model: 'enabled',
    label: 'Enabled',
    textOn: 'This plugin is Enabled',
    textOff: 'This plugin is Disabled',
    inputType: 'hidden',
    styleClasses: 'field-switch top-border bottom-border hide-label',
    default: true,
  },
  name: {
    default: 'application-registration',
    type: 'input',
    inputType: 'hidden',
    styleClasses: 'kong-form-hidden-field-wrapper',
  },
  'service-id': {
    type: 'AutoSuggest',
    label: 'Gateway Service',
    styleClasses: 'bottom-border',
    description: 'Specific Gateway Service in this workspace',
    model: 'service-id',
    entity: 'services',
    placeholder: 'Select a Gateway Service',
    inputValues: {
      fields: ['name', 'id'],
    },
    help: 'The Gateway Service that this plugin configuration will target',
  },
  tags: typedefs.tags,
  protocols: {
    default: [],
    type: 'multiselect',
    label: 'Protocols',
    values: [
      { label: 'grpc', value: 'grpc' },
      { label: 'grpcs', value: 'grpcs' },
      { label: 'http', value: 'http' },
      { label: 'https', value: 'https' },
      { label: 'tcp', value: 'tcp' },
      { label: 'tls', value: 'tls' },
      { label: 'tls_passthrough', value: 'tls_passthrough' },
      { label: 'udp', value: 'udp' },
      { label: 'ws', value: 'ws' },
      { label: 'wss', value: 'wss' },
    ],
    help: 'A list of the request protocols that will trigger this plugin. The default value, as well as the possible values allowed on this field, may change depending on the plugin type.',
    placeholder: 'Select valid protocols for the plugin',
    styleClasses: 'plugin-protocols-select',
  },
}

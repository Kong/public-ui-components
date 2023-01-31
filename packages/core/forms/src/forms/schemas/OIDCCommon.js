export default {
  fields: [{
    help: 'The client id(s) that the plugin uses when it calls authenticated endpoints on the identity provider.',
    inputType: 'text',
    label: 'config.client_id',
    model: 'config-client_id',
    type: 'input',
  }, {
    help: 'The client secret.',
    inputType: 'text',
    label: 'config.client_secret',
    model: 'config-client_secret',
    type: 'input',
  }, {
    help: 'The discovery endpoint (or just the issuer identifier).',
    inputType: 'text',
    label: 'config.issuer',
    model: 'config-issuer',
    required: true,
    type: 'input',
  }, {
    help: 'Types of credentials/grants to enable.',
    inputType: 'text',
    label: 'config.auth_methods',
    model: 'config-auth_methods',
    type: 'input',
  }],
}

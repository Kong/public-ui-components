export default {
  fields: [{
    inputType: 'password',
    label: 'Client ID',
    model: 'config-client_id',
    type: 'input',
  }, {
    inputType: 'password',
    label: 'Client Secret',
    model: 'config-client_secret',
    type: 'input',
  }, {
    inputType: 'text',
    label: 'Issuer',
    model: 'config-issuer',
    required: true,
    type: 'input',
  }, {
    inputType: 'text',
    label: 'Auth Methods',
    model: 'config-auth_methods',
    type: 'input',
  }],
}

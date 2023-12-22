export default {
  fields: [{
    inputType: 'password',
    label: 'Config.Client Id',
    model: 'config-client_id',
    type: 'input',
  }, {
    inputType: 'password',
    label: 'Config.Client Secret',
    model: 'config-client_secret',
    type: 'input',
  }, {
    inputType: 'text',
    label: 'Config.Issuer',
    model: 'config-issuer',
    required: true,
    type: 'input',
  }, {
    inputType: 'text',
    label: 'Config.Auth Methods',
    model: 'config-auth_methods',
    type: 'input',
  }],
}

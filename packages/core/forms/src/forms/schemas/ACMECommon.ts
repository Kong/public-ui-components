export const ACMECommonSchema = {
  fields: [
    {
      inputType: 'text',
      label: 'Config.Account Email',
      model: 'config-account_email',
      required: true,
      type: 'input',
    },
    {
      inputType: 'text',
      label: 'Config.Account Key.Key Id',
      model: 'config-account_key-key_id',
      required: true,
      type: 'input',
    },
    {
      type: 'input',
      inputType: 'text',
      valueType: 'string',
      label: 'Config.Account Key.Key Set',
      model: 'config-account_key-key_set',
      order: 0,
      disabled: false,
    },
    {
      type: 'checkbox',
      default: false,
      valueType: 'boolean',
      label: 'Config.Allow Any Domain',
      model: 'config-allow_any_domain',
      order: 0,
      disabled: false,
    },
  ],
}

export const ACMELetsEncryptSchema = {
  fields: [
    {
      type: 'input',
      default: '',
      inputType: 'text',
      valueType: 'string',
      model: 'config-api_uri',
      label: 'Config.Api Uri',
      order: 0,
      disabled: false,
    },
    {
      type: 'checkbox',
      default: false,
      valueType: 'boolean',
      model: 'config-tos_accepted',
      label: 'Config.Tos Accepted',
      order: 0,
      disabled: false,
    },
  ],
}

export const ACMEZeroSSLSchema = {
  fields: [
    {
      type: 'input',
      default: '',
      inputType: 'text',
      valueType: 'string',
      model: 'config-api_uri',
      label: 'Config.Api Uri',
      order: 0,
      disabled: false,
    },
    {
      type: 'input',
      inputType: 'text',
      valueType: 'string',
      model: 'config-eab_hmac_key',
      label: 'Config.Eab Hmac Key',
      order: 0,
      disabled: false,
    },
    {
      type: 'input',
      inputType: 'text',
      valueType: 'string',
      model: 'config-eab_kid',
      label: 'Config.Eab Kid',
      order: 0,
      disabled: false,
    },
  ],
}

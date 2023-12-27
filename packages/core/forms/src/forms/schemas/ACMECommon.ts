export interface Field {
  label: string
  model: string
  type: string
  default?: any
  disabled?: boolean
  help?: string
  inputType?: string
  order?: number
  required?: boolean
  valueType?: string
}

export interface Schema {
  fields: Field[]
}

export const ACMECommonSchema: Schema = {
  fields: [
    {
      inputType: 'text',
      label: 'Account Email',
      model: 'config-account_email',
      required: true,
      type: 'input',
    },
    {
      inputType: 'text',
      label: 'Account Key.Key ID',
      model: 'config-account_key-key_id',
      required: true,
      type: 'input',
    },
    {
      type: 'input',
      inputType: 'text',
      valueType: 'string',
      label: 'Account Key.Key Set',
      model: 'config-account_key-key_set',
      order: 0,
      disabled: false,
    },
    {
      type: 'checkbox',
      default: false,
      valueType: 'boolean',
      label: 'Allow Any Domain',
      model: 'config-allow_any_domain',
      order: 0,
      disabled: false,
    },
  ],
}

export const ACMELetsEncryptSchema: Schema = {
  fields: [
    {
      type: 'input',
      default: '',
      inputType: 'text',
      valueType: 'string',
      model: 'config-api_uri',
      label: 'API URI',
      order: 0,
      disabled: false,
    },
    {
      type: 'checkbox',
      default: false,
      valueType: 'boolean',
      model: 'config-tos_accepted',
      label: 'TOS Accepted',
      order: 0,
      disabled: false,
    },
  ],
}

export const ACMEZeroSSLSchema: Schema = {
  fields: [
    {
      type: 'input',
      default: '',
      inputType: 'text',
      valueType: 'string',
      model: 'config-api_uri',
      label: 'API URI',
      order: 0,
      disabled: false,
    },
    {
      type: 'input',
      inputType: 'text',
      valueType: 'string',
      model: 'config-eab_hmac_key',
      label: 'EAB HMAC Key',
      order: 0,
      disabled: false,
    },
    {
      type: 'input',
      inputType: 'text',
      valueType: 'string',
      model: 'config-eab_kid',
      label: 'EAB KID',
      order: 0,
      disabled: false,
    },
  ],
}

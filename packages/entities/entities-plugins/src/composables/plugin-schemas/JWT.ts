import type { JwtSecretFieldSchema, JWTPluginSchema } from '../../types/plugins/jwt'

// KAG-3347: BE descriptions missing. Should remove when BE descriptions are available
export const jwtSchema: JWTPluginSchema = {
  'config-cookie_names': {
    label: 'Cookie Names',
    type: 'set',
    help: 'A comma-separated list of cookie names that Kong will inspect to retrieve JWTs.',
  },
  'config-uri_param_names': {
    label: 'URI Parameter Names',
    type: 'set',
    help: 'A comma-separated list of querystring parameters that Kong will inspect to retrieve JWTs.',
  },
}

export const jwtSecretSchema: JwtSecretFieldSchema = {
  fields: [
    {
      key: {
        submitWhenNull: false,
        hint: `A unique string identifying the credential. If left out, it will
               be auto-generated.`,
      },
    },
    {
      algorithm: {
        order: 1,
        hint: 'The algorithm used to verify the token’s signature.',
      },
    },
    {
      rsa_public_key: {
        order: 2,
        type: 'textArea',
        label: 'RSA public-key',
        hint: `If algorithm is RSA or ECDSA, the public key (in PEM format) to
        use to verify the token’s signature.`,
        rows: 10,
        visible: (model) => {
          return model && model.algorithm && /(ES|RS)[\d]{3}/.test(model.algorithm)
        },
      },
    },
    {
      secret: {
        inputType: 'password',
        hint: `If algorithm is HMAC, the secret used to sign JWTs for
               this credential. If left out, will be auto-generated.`,
      },
    },
  ],
}

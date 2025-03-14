import type { JwtSecretFieldSchema } from '../../types/plugins/jwt'
import { tags } from './typedefs'

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
          return model && model.algorithm && /^((RS|PS|ES)(256|384|512)|EdDSA)$/.test(model.algorithm)
        },
      },
    },
    {
      secret: {
        inputType: 'text',
        hint: `If algorithm is HMAC, the secret used to sign JWTs for
               this credential. If left out, will be auto-generated.`,
      },
    },
    {
      tags,
    },
  ],
}

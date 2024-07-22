import type { HmacAuthFieldSchema } from '../../types/plugins/hmac-auth'

export const hmacAuthSchema: HmacAuthFieldSchema = {
  fields: [
    {
      username: {
        hint: 'The username to use in the HMAC Signature verification.',
      },
    },
    {
      secret: {
        inputType: 'text',
        submitWhenNull: false,
        hint: `The secret to use in the HMAC Signature verification. Note that
        if this parameter isn’t provided, Kong will generate a value for you and
        send it as part of the response body.`,
      },
    },
  ],
}

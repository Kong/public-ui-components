import { tags } from './typedefs'

export const keyAuthCredentialSchema = {
  fields: [
    {
      key: {
        submitWhenNull: false,
        hint: `You can optionally set your own unique key to authenticate the
               client. If missing, it will be generated for you.`,
        inputType: 'password',
        encrypted: true,
      },
    },
    {
      tags,
    },
    {
      ttl: {
        help: 'Time-to-live (in seconds) value for data',
      },
    },
  ],
}

import type { BasicAuthFieldSchema } from '../../types/plugins/basic-auth'

export const basicAuthSchema: BasicAuthFieldSchema = {
  fields: [
    {
      username: {},
    },

    {
      password: {
        inputType: 'text',
      },
    },
  ],
}

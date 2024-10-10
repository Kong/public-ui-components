import type { BasicAuthFieldSchema } from '../../types/plugins/basic-auth'
import { tags } from './typedefs'

export const basicAuthSchema: BasicAuthFieldSchema = {
  fields: [
    {
      username: {},
    },

    {
      password: {
        inputType: 'password',
      },
    },
    {
      tags,
    },
  ],
}

import type { KeyAuthSFieldSchema } from '../../types/plugins/key-auth'
import { tags } from './typedefs'

export const keyAuthSchema: KeyAuthSFieldSchema = {
  fields: [
    {
      key: {
        submitWhenNull: false,
        hint: `You can optionally set your own unique key to authenticate the
               client. If missing, it will be generated for you.`,
      },
    },
    {
      tags,
    },
  ],
}

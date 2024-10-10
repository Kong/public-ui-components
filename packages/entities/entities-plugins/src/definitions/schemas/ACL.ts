import type { ACLFieldSchema } from '../../types/plugins/acl'
import { tags } from './typedefs'

export const aclSchema: ACLFieldSchema = {
  fields: [
    {
      group: {
        hint: 'The arbitrary group name to associate to the consumer.',
      },
    },
    {
      tags,
    },
  ],
}

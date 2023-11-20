import type { ACLFieldSchema } from '../../types/plugins/acl'

export const aclSchema: ACLFieldSchema = {
  fields: [
    {
      group: {
        hint: 'The arbitrary group name to associate to the consumer.',
      },
    },
  ],
}

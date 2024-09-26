import type { PluginBasicSchema } from '../../types/plugins'
import type { CommonSchemaFields } from '../../types/plugins/shared'
import type { tags } from '../../definitions/schemas/typedefs'

interface ACLFieldSchema {
  fields: [
    {
      group: {
        hint: string,
      },
    },
    {
      tags: typeof tags,
    },
  ]
}

export type ACLSchema = CommonSchemaFields & PluginBasicSchema & {
  schema: ACLFieldSchema,
  applyCredentialButtonText: string,
  fields: any
}

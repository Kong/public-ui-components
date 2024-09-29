import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'
import type { tags } from '../../definitions/schemas/typedefs'

interface BasicAuthFieldSchema {
  fields: [
    {
      username: object
    },
    {
      password: {
        inputType: string
      }
    },
    {
      tags: typeof tags,
    },
  ]
}

export type BasicAuthSchema = CommonSchemaFields & PluginBasicSchema & {
  schema: BasicAuthFieldSchema,
  fields: any
}

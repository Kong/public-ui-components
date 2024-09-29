import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'
import type { tags } from '../../definitions/schemas/typedefs'

interface KeyAuthSFieldSchema {
  fields: [
    {
      key: {
        submitWhenNull?: boolean
        hint: string
      },
    },
    {
      tags: typeof tags,
    },
  ]
}

export type KeyAuthSchema = PluginBasicSchema & CommonSchemaFields & {
  schema: KeyAuthSFieldSchema,
  fields: any
}

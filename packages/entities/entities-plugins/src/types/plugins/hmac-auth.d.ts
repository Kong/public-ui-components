import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'
import type { tags } from '../../definitions/schemas/typedefs'

interface HmacAuthFieldSchema {
  fields: [
    {
      username: {
        hint: string
      }
    },
    {
      secret: {
        inputType: string
        submitWhenNull?: boolean
        hint: string
      }
    },
    {
      tags: typeof tags
    },
  ]
}

export type HmacAuthSchema = CommonSchemaFields & PluginBasicSchema & {
  schema: HmacAuthFieldSchema
  fields: any
}

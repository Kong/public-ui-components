import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'

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
    }
  ]
}

export type HmacAuthSchema = CommonSchemaFields & PluginBasicSchema & {
  schema: HmacAuthFieldSchema,
  fields: any
}

import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'

interface BasicAuthFieldSchema {
  fields: [
    {
      username: object
    },
    {
      password: {
        inputType: string
      }
    }
  ]
}

export type BasicAuthSchema = CommonSchemaFields & PluginBasicSchema & {
  schema: BasicAuthFieldSchema,
  fields: any
}

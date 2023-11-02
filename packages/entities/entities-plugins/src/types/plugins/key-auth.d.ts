import type { CommonSchemaFields, PluginBasicSchema } from '../../types/plugins/shared'

interface KeyAuthSFieldSchema {
  fields: [
    {
      key: {
        submitWhenNull?: boolean
        hint: string
      }
    }
  ]
}

export type KeyAuthSchema = PluginBasicSchema & CommonSchemaFields & {
  schema: KeyAuthSFieldSchema,
  fields: any
}

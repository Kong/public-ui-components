import type { PluginBasicSchema } from '../../types/plugins'

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

export type KeyAuthSchema = PluginBasicSchema & {
  schema: KeyAuthSFieldSchema,
  fields: any
}

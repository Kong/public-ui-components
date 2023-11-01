import type { PluginBasicSchema } from '../../types/plugins'

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

export type BasicAuthSchema = PluginBasicSchema & {
  schema: BasicAuthFieldSchema,
  fields: any
}

import type { PluginBasicSchema } from '../../types/plugins'
import type { CommonSchemaFields } from '../../types/plugins/shared'

interface ACLFieldSchema {
  fields: [
    {
      group: {
        hint: string,
      }
    }
  ]
}

export type ACLSchema = CommonSchemaFields & PluginBasicSchema & {
  schema: ACLFieldSchema,
  applyCredentialButtonText: string,
  fields: any
}

import type { PluginBasicSchema } from '../../types/plugins'

interface ACLFieldSchema {
  fields: [
    {
      group: {
        hint: string,
      }
    }
  ]
}

export type ACLSchema = PluginBasicSchema & {
  schema: ACLFieldSchema,
  applyCredentialButtonText: string,
  fields: any
}

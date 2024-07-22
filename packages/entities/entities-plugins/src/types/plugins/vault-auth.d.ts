import type { CommonSchemaFields } from './shared'

export interface VaultAuthSchema extends CommonSchemaFields {
  'config-vault': {
    type: string
    entity: string
    placeholder: string
    inputValues: {
      fields: string[]
    }
    modelTransformer: (val: string) => { id: string }
    keyFromObject: string
  }
}

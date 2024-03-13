import type { CommonSchemaFields } from './shared'

export interface OasValidationSchema extends CommonSchemaFields {
  'config-api_spec': {
    type: string
    rows: number
  }
}

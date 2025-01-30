import type { CommonSchemaFields } from './shared'

export interface OasValidationSchema extends CommonSchemaFields {
  'config-api_spec': {
    label: string
    placeholder: string
    type: string
    rows: number
    max: boolean | number
  }
}

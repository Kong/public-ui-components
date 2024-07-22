import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface MockingSchema extends CommonSchemaFields {
  'config-api_specification': {
    label: string,
    placeholder: string,
    type: string,
    rows: number
  }
}

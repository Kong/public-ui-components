import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface InjectionProtectionSchema extends CommonSchemaFields {
  'config-injection_types': {
    type: string
  }
  'config-locations': {
    type: string
  }
}

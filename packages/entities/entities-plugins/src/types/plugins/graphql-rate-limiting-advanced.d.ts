import type { Field, CommonSchemaFields } from '../../types/plugins/shared'

export interface GraphQLRateLimitingAdvancedSchema extends CommonSchemaFields{
  'config-strategy': Field,
}

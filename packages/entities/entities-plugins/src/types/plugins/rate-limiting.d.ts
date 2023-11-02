import type { Field, CommonSchemaFields } from '../../types/plugins/shared'

export interface RateLimitingSchema extends CommonSchemaFields {
  'config-policy': Field,
  'config-strategy': Field,
  'config-consumer_groups': Field,
}

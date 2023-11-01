import type { Field } from '../../types/plugins/shared'

export interface RateLimitingSchema {
  'config-policy': Field,
  'config-strategy': Field,
  'config-consumer_groups': Field,
}

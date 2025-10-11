import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface SolaceUpstreamSchema extends CommonSchemaFields {
  'config-message-functions': ReturnArrayItem
}

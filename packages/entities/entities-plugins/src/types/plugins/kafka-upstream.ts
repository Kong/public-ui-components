import type { ReturnArrayItem } from '../../types/plugins/typedefs'
import type { CommonSchemaFields } from '../../types/plugins/shared'

export interface KafkaUpstreamSchema extends CommonSchemaFields {
  'config-message_by_lua_functions': ReturnArrayItem
}

import type { KafkaUpstreamSchema } from '../../types/plugins/kafka-upstream'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'

export const kafkaUpstreamSchema: KafkaUpstreamSchema = {
  'config-message_by_lua_functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}

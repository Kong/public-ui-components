import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'
import type { KafkaConsumeSchema } from '../../types/plugins/kafka-consume'

export const kafkaConsumeSchema: KafkaConsumeSchema = {
  'config-message_by_lua_functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },
}

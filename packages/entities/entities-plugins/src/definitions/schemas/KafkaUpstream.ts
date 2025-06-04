import type { KafkaUpstreamSchema } from '../../types/plugins/kafka-upstream'
import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'
import { stripEmptyBasicFields } from '../../utils/helper'

export const kafkaUpstreamSchema: KafkaUpstreamSchema = {
  'config-message_by_lua_functions': {
    ...ArrayInputFieldSchema,
    inputAttributes: {
      ...ArrayInputFieldSchema.inputAttributes,
      type: 'textarea',
      max: false,
    },
  },

  // Clean up empty authentication fields in the payload before submission.
  // This removes the empty 'basic' authentication object
  // when both username and password are not provided.
  shamefullyTransformPayload: ({ payload }) => {
    stripEmptyBasicFields(payload.config?.schema_registry)
  },
}

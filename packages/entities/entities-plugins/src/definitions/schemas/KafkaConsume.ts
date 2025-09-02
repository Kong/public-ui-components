import { ArrayInputFieldSchema } from './ArrayInputFieldSchema'
import type { KafkaConsumeSchema } from '../../types/plugins/kafka-consume'
import { stripEmptyBasicFields, type SchemaRegistry } from '../../utils/helper'

export const kafkaConsumeSchema: KafkaConsumeSchema = {
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

    payload.config?.topics?.forEach((topic: { schema_registry: SchemaRegistry }) => {
      stripEmptyBasicFields(topic?.schema_registry)
    })
  },
}

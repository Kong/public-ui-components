import type { CommonSchemaFields } from '../../types/plugins/shared'
import { stripEmptyBasicFields, type SchemaRegistry } from '../../utils/helper'

export const kafkaConsumeSchema: CommonSchemaFields = {
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

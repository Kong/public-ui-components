import type { CommonSchemaFields } from '../../types/plugins/shared'
import { stripEmptyBasicFields } from '../../utils/helper'

export const kafkaLogSchema: CommonSchemaFields = {
  // Clean up empty authentication fields in the payload before submission.
  // This removes the empty 'basic' authentication object
  // when both username and password are not provided.
  shamefullyTransformPayload: ({ payload }) => {
    stripEmptyBasicFields(payload.config?.schema_registry)
  },
}

import { tags } from './typedefs'
import type { UseSchemasOptions } from 'src/composables/useSchemas'
import type { CommonSchemaFields } from 'src/types/plugins/shared'

export default {
  fields: [
    {
      key: {
        submitWhenNull: false,
        hint: `You can optionally set your own unique key to authenticate the
               client. If missing, it will be generated for you.`,
        inputType: 'password',
        encrypted: true,
      },
    },
    {
      tags,
    },
    {
      ttl: {
        help: 'Time-to-live (in seconds) value for data',
      },
    },
  ],
}

export const genKeyAuthEncSchema = (options?: UseSchemasOptions): CommonSchemaFields => {
  if (options?.app === 'kongManager') {
    return {
      shamefullyTransformPayload: ({ payload }) => {
        if (options?.credential && typeof payload.ttl !== 'number' || Number.isNaN(payload.ttl)) {
          payload.ttl = 0
        }
      },
    }
  }
  return {}
}

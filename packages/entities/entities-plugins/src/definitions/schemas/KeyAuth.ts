import { markRaw } from 'vue'
import { tags } from './typedefs'

import KeyAuthIdentityRealms from '../../components/fields/KeyAuthIdentityRealms.vue'

import type { UseSchemasOptions } from 'src/composables/useSchemas'
import type { CommonSchemaFields } from 'src/types/plugins/shared'

export const keyAuthCredentialSchema = {
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

export type KeyAuthSchema = CommonSchemaFields & {
  fieldsToDelete?: string[]
  'config-identity_realms'?: Record<string, any>
}

export const genKeyAuthSchema = (options?: UseSchemasOptions): KeyAuthSchema => {
  if (options?.app === 'kongManager') {
    return {
      fieldsToDelete: ['config-identity_realms'],
      shamefullyTransformPayload: ({ payload }) => {
        if (options?.credential && typeof payload.ttl !== 'number' || Number.isNaN(payload.ttl)) {
          payload.ttl = 0
        }
      },
    }
  } else {
    const ffOn = options?.experimentalRenders?.keyAuthIdentityRealms ?? false

    return {
      'config-identity_realms': {
        component: ffOn ? markRaw(KeyAuthIdentityRealms) : null,
      },
    }
  }
}

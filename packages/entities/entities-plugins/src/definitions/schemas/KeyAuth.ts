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
      },
    },
    {
      tags,
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
    }
  } else {
    return {
      'config-identity_realms': {
        component: markRaw(KeyAuthIdentityRealms),
      },
    }
  }
}

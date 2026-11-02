<template>
  <div class="kong-ui-entities-secrets-list">
    <SecretListInner
      v-if="resolvedConfigStoreId"
      :key="storeKey"
      v-bind="props"
      :config-store-id="resolvedConfigStoreId"
      @delete:success="handleDeleteSuccess"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { AxiosError } from 'axios'
import SecretListInner from './SecretListInner.vue'
import composables from '../composables'

import type {
  KonnectSecretListConfig,
  SecretEntityRow,
} from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void
  (e: 'delete:success', route: SecretEntityRow): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** Resolved store. Null/empty disables rendering without falling back to a Vault GET. */
  configStoreId: {
    type: String as PropType<string | null>,
    default: undefined,
    validator: (value: string | null) => value === null || value.trim().length > 0,
  },
  /** The base konnect config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectSecretListConfig>,
    required: true,
    validator: (config: KonnectSecretListConfig): boolean => {
      if (!config || config?.app !== 'konnect') return false
      if (!config.createRoute || !config.getEditRoute) return false
      if (config.apiType === 'aiGateway' && !config.aiGatewayId) return false
      return true
    },
  },
  // The vault id for the secrets
  vaultId: {
    type: String,
    required: true,
  },
  // used to override the default identifier for the cache entry
  cacheIdentifier: {
    type: String,
    default: '',
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new entity */
  canCreate: {
    type: Function as PropType<() => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can delete a given entity */
  canDelete: {
    type: Function as PropType<(row: SecretEntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
  /** A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can edit a given entity */
  canEdit: {
    type: Function as PropType<(row: SecretEntityRow) => boolean | Promise<boolean>>,
    required: false,
    default: async () => true,
  },
})

const handleError = (error: AxiosError): void => {
  emit('error', error)
}

const handleDeleteSuccess = (route: SecretEntityRow): void => {
  emit('delete:success', route)
}

const { configStoreId: resolvedConfigStoreId, storeKey } = composables.useSecretConfigStore(props, handleError)
</script>

<style lang="scss" scoped>
.kong-ui-entities-secrets-list {
  width: 100%;
}
</style>

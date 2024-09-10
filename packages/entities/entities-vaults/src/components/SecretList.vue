<template>
  <div class="kong-ui-entities-secrets-list">
    <SecretListInner
      v-if="configStoreId"
      v-bind="props"
      :config-store-id="configStoreId"
      @delete:success="handleDeleteSuccess"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, onBeforeMount } from 'vue'
import type { AxiosError } from 'axios'
import { useAxios } from '@kong-ui-public/entities-shared'
import SecretListInner from './SecretListInner.vue'
import endpoints from '../secrets-endpoints'

import type {
  KonnectSecretListConfig,
  SecretEntityRow,
} from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'error', error: AxiosError): void,
  (e: 'delete:success', route: SecretEntityRow): void,
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectSecretListConfig>,
    required: true,
    validator: (config: KonnectSecretListConfig): boolean => {
      if (!config || config?.app !== 'konnect') return false
      if (!config.createRoute || !config.getEditRoute) return false
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

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const configStoreId = ref<string>('')

const fetchVaultUrl = computed<string>(() => {
  return `${props.config.apiBaseUrl}${endpoints.getVault[props.config.app]}`
    .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
    .replace(/{id}/gi, props.vaultId)
})

onBeforeMount(async () => {
  try {
    const { data } = await axiosInstance.get(fetchVaultUrl.value)
    configStoreId.value = data?.config?.config_store_id
  } catch (err: any) {
    emit('error', err)
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-secrets-list {
  width: 100%;
}
</style>

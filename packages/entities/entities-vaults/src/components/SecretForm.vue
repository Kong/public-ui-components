<template>
  <div class="kong-ui-entities-secret-form">
    <SecretFormInner
      v-if="configStoreId"
      v-bind="props"
      :config-store-id="configStoreId"
      @error="handleError"
      @loading="handleLoading"
      @update="handleUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { useAxios } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, onBeforeMount, ref } from 'vue'
import type { AxiosError } from 'axios'
import type {
  SecretStateFields,
  KonnectSecretFormConfig,
} from '../types'
import endpoints from '../secrets-endpoints'
import SecretFormInner from './SecretFormInner.vue'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectSecretFormConfig>,
    required: true,
    validator: (config: KonnectSecretFormConfig): boolean => {
      if (!config || config.app !== 'konnect') return false
      if (!config.controlPlaneId || !config.cancelRoute) return false
      return true
    },
  },
  /** Current vault ID */
  vaultId: {
    type: String,
    required: true,
  },
  /** If a valid secretId is provided, it will put the form in Edit mode instead of Create */
  secretId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: SecretStateFields): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
}>()

const handleUpdate = (data: SecretStateFields): void => {
  emit('update', data)
}

const handleError = (error: AxiosError): void => {
  emit('error', error)
}

const handleLoading = (isLoading: boolean): void => {
  emit('loading', isLoading)
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
.kong-ui-entities-secret-form {
  width: 100%;
}
</style>

<template>
  <div class="kong-ui-entities-secret-form">
    <SecretFormInner
      v-if="resolvedConfigStoreId"
      :key="innerKey"
      v-bind="props"
      :config-store-id="resolvedConfigStoreId"
      @error="handleError"
      @loading="handleLoading"
      @update="handleUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { AxiosError } from 'axios'
import type {
  SecretStateFields,
  KonnectSecretFormConfig,
} from '../types'
import composables from '../composables'
import SecretFormInner from './SecretFormInner.vue'

const props = defineProps({
  /** Resolved store. Null/empty disables rendering without falling back to a Vault GET. */
  configStoreId: {
    type: String as PropType<string | null>,
    default: undefined,
    validator: (value: string | null) => value === null || value.trim().length > 0,
  },
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectSecretFormConfig>,
    required: true,
    validator: (config: KonnectSecretFormConfig): boolean => {
      if (!config || config.app !== 'konnect') return false
      if (config.apiType !== 'aiGateway' && !config.controlPlaneId) return false
      if (!config.cancelRoute) return false
      if (config.apiType === 'aiGateway' && !config.aiGatewayId) return false
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
  (e: 'update', data: SecretStateFields): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
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

const { configStoreId: resolvedConfigStoreId, storeKey } = composables.useSecretConfigStore(props, handleError)
const innerKey = computed(() => [storeKey.value, props.secretId].join(':'))
</script>

<style lang="scss" scoped>
.kong-ui-entities-secret-form {
  width: 100%;
}
</style>

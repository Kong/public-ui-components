<template>
  <KModal
    :action-button-disabled="!canProceed"
    :action-button-text="proceedButtonText || t('vault_secret_picker.actions.use_key')"
    class="vault-secret-picker"
    data-testid="vault-secret-picker-modal"
    :title="title || t('vault_secret_picker.title')"
    :visible="props.setup !== false"
    @cancel="() => emit('cancel')"
    @proceed="handleProceed"
  >
    <KEmptyState
      v-if="vaultsFetchError || secretsFetchError"
      data-testid="vault-secret-picker-fetch-error"
      icon-variant="error"
      :message="errorMessage"
    />

    <div
      v-else
      class="inputs-wrapper"
    >
      <slot name="form-prefix" />

      <KSelect
        v-model="selectedVaultPrefix"
        clearable
        data-testid="vault-secret-picker-vault-select"
        :disabled="setupLoading"
        enable-filtering
        :filter-function="() => true"
        :items="availableVaults"
        :kpop-attributes="{ 'data-testid': 'vault-secret-picker-vault-popover' }"
        :label="t('vault_secret_picker.vault.label')"
        :loading="loadingVaults"
        :placeholder="t('vault_secret_picker.vault.placeholder')"
        required
        reuse-item-template
        width="100%"
        @query-change="debouncedVaultsQuery"
      >
        <template #loading>
          <div>{{ t('actions.loading') }}</div>
        </template>
        <template #empty>
          <div data-testid="no-search-results">
            {{ t('vault_secret_picker.no_results') }}
          </div>
        </template>
        <template #selected-item-template="{ item }">
          <span class="k-select-selected-item-label">
            {{ formatSelectedVault(item as SelectVaultItem) }}
          </span>
        </template>
        <template #item-template="{ item }">
          <div class="vault-secret-picker-vault-dropdown-item">
            <span class="select-item-label">{{ item.label }}</span>
            <span class="select-item-description">{{ item.vault.name }}</span>
            <span class="select-item-description">{{ item.vault.id }}</span>
          </div>
        </template>
      </KSelect>

      <KSelect
        v-if="isKonnectVaultSelected"
        v-model="secretId"
        clearable
        data-testid="vault-secret-picker-secret-id-select"
        :disabled="setupLoading || !selectedVault"
        enable-filtering
        :filter-function="() => true"
        :items="availableSecrets"
        :kpop-attributes="{ 'data-testid': 'vault-secret-picker-secret-id-popover' }"
        :label="t('vault_secret_picker.secret_id.label')"
        :loading="loadingSecrets"
        :placeholder="t('vault_secret_picker.secret_id.select_placeholder')"
        required
        reuse-item-template
        width="100%"
        @query-change="debouncedSecretsQuery"
      >
        <template #loading>
          <div>{{ t('actions.loading') }}</div>
        </template>
        <template #empty>
          <div data-testid="no-search-results">
            {{ t('vault_secret_picker.no_results') }}
          </div>
        </template>
      </KSelect>

      <KInput
        v-else
        v-model.trim="secretId"
        autocomplete="off"
        data-testid="vault-secret-picker-secret-id-input"
        :disabled="setupLoading || !selectedVault"
        :label="t('vault_secret_picker.secret_id.label')"
        :placeholder="t('vault_secret_picker.secret_id.input_placeholder')"
        required
        type="text"
      />

      <KInput
        v-model.trim="optionalSecretKey"
        autocomplete="off"
        data-testid="vault-secret-picker-secret-key-input"
        :disabled="setupLoading || !selectedVault"
        :help="t('vault_secret_picker.optional_secret_key.help')"
        :label="t('vault_secret_picker.optional_secret_key.label')"
        :placeholder="t('vault_secret_picker.optional_secret_key.placeholder')"
        type="text"
      />
    </div>
  </KModal>
</template>

<script lang="ts">
import { useAxios, useDebouncedFilter, type KongManagerBaseFormConfig, type KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { SecretEntityRow as SecretEntity, EntityRow as VaultEntity } from '../types'
import vaultsEndpoints from '../vaults-endpoints'
import secretsEndpoints from '../secrets-endpoints'
import type { SelectItem } from '@kong/kongponents'
import { computed, nextTick, ref, watch, type PropType } from 'vue'
import composables from '../composables'
import { buildSecretRef, parseSecretRef } from '../utils'

export interface SelectVaultItem extends SelectItem {
  vault: VaultEntity
}
</script>

<script setup lang="ts">
const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  config: {
    type: Object as PropType<KonnectBaseFormConfig | KongManagerBaseFormConfig>,
    required: true,
    validator: (config: KonnectBaseFormConfig | KongManagerBaseFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      return true
    },
  },
  setup: {
    type: null as unknown as PropType<string | false>,
    required: false,
    default: false,
  },
  title: {
    type: String,
    required: false,
    default: undefined,
  },
  proceedButtonText: {
    type: String,
    required: false,
    default: undefined,
  },
  additionalDisabled: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  proceed: [secretRef: string]
  cancel: []
}>()

const { axiosInstance } = useAxios({
  // 404 errors are allowed in this components
  validateStatus: (status: number) => status === 404 || (status >= 200 && status < 300),
  // Spread the passed-in config later to allow overriding
  ...props.config?.axiosRequestConfig,
})

const setupLoading = ref(false)
const selectedVaultPrefix = ref('')
const secretId = ref('')
const optionalSecretKey = ref('')

const selectedVault = ref<VaultEntity | undefined>()

// Endpoint to list secrets for a Konnect Vault
// We don't care about other typed vaults
const secretsEndpoint = computed(() => {
  if (props.config.app === 'konnect') {
    return secretsEndpoints.list[props.config.app].replace(/{id}/gi, selectedVault.value?.config?.config_store_id ?? '')
  }

  return '<not_applicable>'
})

const errorMessage = computed(() => {
  if (vaultsFetchError && secretsFetchError) {
    return t('vault_secret_picker.fetch_error.vaults_and_secrets')
  }

  if (vaultsFetchError) {
    return t('vault_secret_picker.fetch_error.vaults')
  }

  if (secretsFetchError) {
    return t('vault_secret_picker.fetch_error.secrets')
  }

  return undefined
})

// Vault fetching
const {
  debouncedQueryChange: debouncedVaultsQuery,
  loading: loadingVaults,
  error: vaultsFetchError,
  loadItems: loadVaults,
  results: vaultsResults,
} = useDebouncedFilter(props.config, vaultsEndpoints.list[props.config.app].getAll, undefined, {
  fetchedItemsKey: 'data',
  searchKeys: ['prefix'],
})

// Secret fetching
const {
  debouncedQueryChange: debouncedSecretsQuery,
  loading: loadingSecrets,
  error: secretsFetchError,
  loadItems: loadSecrets,
  results: secretsResults,
} = useDebouncedFilter(props.config, secretsEndpoint, undefined, {
  fetchedItemsKey: 'data',
  searchKeys: ['key'],
  exactMatchKey: 'key',
})

const availableVaults = computed<SelectVaultItem[]>(() => {
  let hasSelectedVault = false

  const items = vaultsResults.value?.map((v) => {
    if (v.prefix === selectedVaultPrefix.value) {
      hasSelectedVault = true
    }

    return { label: v.prefix, value: v.prefix, vault: v as VaultEntity }
  }) ?? []


  if (!hasSelectedVault && selectedVault.value) {
    items.push({
      label: selectedVault.value.prefix,
      value: selectedVault.value.prefix,
      vault: selectedVault.value,
    })
  }

  return items
})

const availableSecrets = computed<SelectItem[]>(() => {
  let hasSecret = false

  const items = secretsResults.value?.map((s) => {
    if (s.key === secretId.value) {
      hasSecret = true
    }

    return { label: s.key, value: s.key }
  }) ?? []

  if (!hasSecret && secretId.value) {
    items.push({ label: secretId.value, value: secretId.value })
  }

  return items
})

const isKonnectVaultSelected = computed(() => selectedVault?.value?.name === 'konnect')

const canProceed = computed(() => Boolean(selectedVault.value) && Boolean(secretId.value) && !props.additionalDisabled)

const formatSelectedVault = (item: SelectVaultItem) => {
  return item.label ? `${item.label} - (${item.vault.name} - ${item.vault.id})` : item.value
}

const buildVaultFetchUrl = (vaultPrefix: string) => {
  let url = `${props.config.apiBaseUrl}${vaultsEndpoints.form[props.config.app].edit}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Replacing {id} with the prefix because /vaults/:prefix is allowed
  return url.replace(/{id}/gi, vaultPrefix)
}

const buildSecretFetchUrl = (secretId: string, configStoreId: string) => {
  if (props.config.app !== 'konnect') {
    // We should never use this URL
    return '<not_applicable>'
  }

  return `${props.config.apiBaseUrl}${secretsEndpoints.form[props.config.app].edit}`
    .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
    .replace(/{id}/gi, configStoreId)
    .replace(/{secretId}/gi, secretId)
}

const handleProceed = () => {
  emit('proceed', buildSecretRef({
    vaultPrefix: selectedVaultPrefix.value,
    secretId: secretId.value || undefined, // Either a non-empty string or undefined
    optionalSecretKey: optionalSecretKey.value || undefined, // Either a non-empty string or undefined
  }))
}

watch(() => props.setup, async (secretRef) => {
  if (secretRef === false) {
    return
  }

  setupLoading.value = true

  selectedVaultPrefix.value = ''
  selectedVault.value = undefined
  secretId.value = ''
  optionalSecretKey.value = ''

  if (typeof secretRef === 'string' && secretRef.trim().length > 0) {
    try {
      let verifiedVault: VaultEntity | undefined
      let verifiedVaultPrefix = ''
      let verifiedSecretId = ''
      let verifiedOptionalSecretKey = ''

      const parsed = parseSecretRef(secretRef)
      const { data: vault } = await axiosInstance.get<VaultEntity | undefined>(buildVaultFetchUrl(parsed.vaultPrefix))

      // Ensure the vault exists
      if (vault?.name) {
        verifiedVault = vault
        verifiedVaultPrefix = parsed.vaultPrefix

        if (verifiedVault.name === 'konnect') {
          if (parsed.secretId) {
            // Check if the secret exists in the Konnect vault
            const { data: secret } = await axiosInstance.get<SecretEntity>(buildSecretFetchUrl(parsed.secretId, vault.config.config_store_id))

            // Ensure the secret exists
            // Secret key is secret ID in the secret reference
            if (secret.key === parsed.secretId) {

              verifiedSecretId = parsed.secretId
              verifiedOptionalSecretKey = parsed.optionalSecretKey ?? ''
            }
          }
        } else {


          // We assume the secret ID and key are correct because we have no way to validate them
          verifiedSecretId = parsed.secretId ?? ''
          verifiedOptionalSecretKey = parsed.optionalSecretKey ?? ''
        }
      }

      await nextTick(() => {
        selectedVaultPrefix.value = verifiedVaultPrefix
        selectedVault.value = verifiedVault
        secretId.value = verifiedSecretId
        optionalSecretKey.value = verifiedOptionalSecretKey
      })
    } catch (e) {
      // Invalid secret reference
      console.debug(e)
    }
  }

  setupLoading.value = false

  await loadVaults()
}, { immediate: true })

watch(selectedVaultPrefix, async (newValue, oldValue) => {
  if (setupLoading.value || newValue === oldValue) {
    return
  }

  selectedVault.value = availableVaults.value.find((vault) => vault.value === newValue)?.vault
  // Clear the secret ID and optional secret key as the selected vault has updated
  secretId.value = ''
  optionalSecretKey.value = ''
})

// Reactivity chain: selectedVault -> secretsEndpoint
watch(secretsEndpoint, async () => {
  // Do not load secrets if the vault is not a Konnect vault
  if (isKonnectVaultSelected.value) {
    await loadSecrets()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.vault-secret-picker {
  .inputs-wrapper {
    display: flex;
    flex-direction: column;
    gap: $kui-space-70;
  }

  &-vault-dropdown-item,
  &-secret-dropdown-item {
    display: flex;
    flex-direction: column;

    span {
      line-height: $kui-line-height-30;
    }

    .select-item-label {
      font-weight: $kui-font-weight-semibold;
    }
  }

  &-vault-dropdown-item {
    .select-item-description {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
    }
  }

  .k-empty-state {
    background: none;
    box-sizing: border-box;
  }
}
</style>

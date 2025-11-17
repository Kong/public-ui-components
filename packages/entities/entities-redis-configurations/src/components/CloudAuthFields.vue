<template>
  <template
    v-for="field in visibleFields"
    :key="field.key"
  >
    <template v-if="field.type !== 'boolean'">
      <KInput
        v-model="model[field.key] as string"
        :data-testid="`redis-${field.key}-input`"
        :label="field.label"
        :label-attributes="{
          info: field.tooltip,
          tooltipAttributes: { maxWidth: '400' },
        }"
        :readonly="readonly"
        :required="field.required ?? false"
        :show-password-mask-toggle="field.encrypted"
        :type="field.encrypted ? 'password' : 'text'"
      />
      <VaultSecretPickerProvider
        v-if="field.referenceable"
        class="secret-picker-provider"
        :disabled="readonly"
        :update="v => (model[field.key] as string) = v"
        :value="model[field.key] as string ?? ''"
        @open="(value, update) => setUpVaultSecretPicker(value, update)"
      />
    </template>
    <KCheckbox
      v-else
      v-model="model[field.key] as boolean"
      :data-testid="`redis-${field.key}-checkbox`"
      :label="field.label"
      :label-attributes="{
        info: field.tooltip,
        tooltipAttributes: { maxWidth: '400' },
      }"
      :readonly="readonly"
    />
  </template>

  <VaultSecretPicker
    :config="config"
    :setup="vaultSecretPickerSetup"
    @cancel="() => vaultSecretPickerSetup = false"
    @proceed="handleVaultSecretPickerAutofill"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { VaultSecretPicker, VaultSecretPickerProvider } from '@kong-ui-public/entities-vaults'
import '@kong-ui-public/entities-vaults/dist/style.css'
import composables from '../composables'
import { useVaultSecretPicker } from '../composables/useVaultSecretPicker'
import { AuthProvider } from '../types'

import type {
  KongManagerRedisConfigurationFormConfig,
  KonnectRedisConfigurationFormConfig,
  RedisConfigurationFields,
} from '../types'

defineProps<{
  config: KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig
  readonly: boolean
}>()
const model = defineModel<RedisConfigurationFields['config']['cloud_authentication']>({ required: true })

const { i18n: { t } } = composables.useI18n()
const {
  vaultSecretPickerSetup,
  setUpVaultSecretPicker,
  handleVaultSecretPickerAutofill,
} = useVaultSecretPicker()

interface Field {
  key: keyof RedisConfigurationFields['config']['cloud_authentication']
  group: AuthProvider
  label: string
  tooltip: string
  required?: boolean
  type?: string
  referenceable?: boolean
  encrypted?: boolean
}

const fields: Field[] = [
  {
    key: 'aws_cache_name',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_cache_name.label'),
    tooltip: t('form.fields.cloud_authentication.aws_cache_name.tooltip'),
    required: true,
    referenceable: true,
  },
  {
    key: 'aws_region',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_region.label'),
    tooltip: t('form.fields.cloud_authentication.aws_region.tooltip'),
    referenceable: true,
  },
  {
    key: 'aws_is_serverless',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_is_serverless.label'),
    tooltip: t('form.fields.cloud_authentication.aws_is_serverless.tooltip'),
    type: 'boolean',
  },
  {
    key: 'aws_access_key_id',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_access_key_id.label'),
    tooltip: t('form.fields.cloud_authentication.aws_access_key_id.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'aws_secret_access_key',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_secret_access_key.label'),
    tooltip: t('form.fields.cloud_authentication.aws_secret_access_key.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'aws_assume_role_arn',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_assume_role_arn.label'),
    tooltip: t('form.fields.cloud_authentication.aws_assume_role_arn.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'aws_role_session_name',
    group: AuthProvider.AWS,
    label: t('form.fields.cloud_authentication.aws_role_session_name.label'),
    tooltip: t('form.fields.cloud_authentication.aws_role_session_name.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'gcp_service_account_json',
    group: AuthProvider.GCP,
    label: t('form.fields.cloud_authentication.gcp_service_account_json.label'),
    tooltip: t('form.fields.cloud_authentication.gcp_service_account_json.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'azure_client_id',
    group: AuthProvider.AZURE,
    label: t('form.fields.cloud_authentication.azure_client_id.label'),
    tooltip: t('form.fields.cloud_authentication.azure_client_id.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'azure_client_secret',
    group: AuthProvider.AZURE,
    label: t('form.fields.cloud_authentication.azure_client_secret.label'),
    tooltip: t('form.fields.cloud_authentication.azure_client_secret.tooltip'),
    referenceable: true,
    encrypted: true,
  },
  {
    key: 'azure_tenant_id',
    group: AuthProvider.AZURE,
    label: t('form.fields.cloud_authentication.azure_tenant_id.label'),
    tooltip: t('form.fields.cloud_authentication.azure_tenant_id.tooltip'),
    referenceable: true,
    encrypted: true,
  },
]

const visibleFields = computed(() => {
  return fields.filter(field => field.group === model.value?.auth_provider)
})
</script>

<style lang="scss" scoped>
.secret-picker-provider {
  margin-top: $kui-space-40 !important;
}
</style>

<template>
  <KInput
    v-model.trim="model.token_endpoint"
    data-testid="redis-oauth-token_endpoint-input"
    :label="t('form.fields.oauth.token_endpoint.label')"
    :label-attributes="{
      info: t('form.fields.oauth.token_endpoint.tooltip'),
      tooltipAttributes: { maxWidth: '400' },
    }"
    :readonly="readonly"
    required
  />

  <KSelect
    v-model="model.auth_method"
    data-testid="redis-oauth-auth_method-select"
    :items="authMethodOptions"
    :kpop-attributes="{ 'data-testid': 'redis-oauth-auth_method-select-popover' }"
    :label="t('form.fields.oauth.auth_method.label')"
    :label-attributes="{ info: t('form.fields.oauth.auth_method.tooltip') }"
    :readonly="readonly"
  />

  <KSelect
    v-model="model.grant_type"
    data-testid="redis-oauth-grant_type-select"
    :items="grantTypeOptions"
    :kpop-attributes="{ 'data-testid': 'redis-oauth-grant_type-select-popover' }"
    :label="t('form.fields.oauth.grant_type.label')"
    :label-attributes="{ info: t('form.fields.oauth.grant_type.tooltip') }"
    :readonly="readonly"
  />

  <!-- username/password are only used by the `password` grant type -->
  <template v-if="model.grant_type === OauthGrantType.PASSWORD">
    <KInput
      v-model.trim="model.username"
      data-testid="redis-oauth-username-input"
      :label="t('form.fields.oauth.username.label')"
      :label-attributes="{
        info: t('form.fields.oauth.username.tooltip'),
        tooltipAttributes: { maxWidth: '400' },
      }"
      :readonly="readonly"
    />
    <VaultSecretPickerProvider
      class="secret-picker-provider"
      :disabled="readonly"
      :update="v => model.username = v"
      :value="model.username ?? ''"
      @open="(value, update) => setUpVaultSecretPicker(value, update)"
    />
    <KInput
      v-model.trim="model.password"
      data-testid="redis-oauth-password-input"
      :label="t('form.fields.oauth.password.label')"
      :label-attributes="{
        info: t('form.fields.oauth.password.tooltip'),
        tooltipAttributes: { maxWidth: '400' },
      }"
      :readonly="readonly"
      show-password-mask-toggle
      type="password"
    />
    <VaultSecretPickerProvider
      class="secret-picker-provider"
      :disabled="readonly"
      :update="v => model.password = v"
      :value="model.password ?? ''"
      @open="(value, update) => setUpVaultSecretPicker(value, update)"
    />
  </template>

  <KSelect
    v-model="model.client_secret_jwt_alg"
    data-testid="redis-oauth-client_secret_jwt_alg-select"
    :items="clientSecretJwtAlgOptions"
    :kpop-attributes="{ 'data-testid': 'redis-oauth-client_secret_jwt_alg-select-popover' }"
    :label="t('form.fields.oauth.client_secret_jwt_alg.label')"
    :label-attributes="{ info: t('form.fields.oauth.client_secret_jwt_alg.tooltip') }"
    :readonly="readonly"
  />

  <template
    v-for="field in stringFields"
    :key="field.key"
  >
    <KInput
      v-model.trim="model[field.key] as string"
      :data-testid="`redis-oauth-${field.key}-input`"
      :label="t(`form.fields.oauth.${field.key}.label`)"
      :label-attributes="{
        info: t(`form.fields.oauth.${field.key}.tooltip`),
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

  <StringArrayField
    v-model="model.scopes"
    :add-button-text="t('form.fields.oauth.scopes.add_button')"
    :label="t('form.fields.oauth.scopes.label')"
    :readonly="readonly"
    test-id-prefix="redis-oauth-scopes"
    :tooltip="t('form.fields.oauth.scopes.tooltip')"
  />

  <KeyValueField
    v-model="model.token_headers"
    :add-button-text="t('form.fields.oauth.token_headers.add_button')"
    :label="t('form.fields.oauth.token_headers.label')"
    :readonly="readonly"
    test-id-prefix="redis-oauth-token_headers"
    :tooltip="t('form.fields.oauth.token_headers.tooltip')"
  />

  <KeyValueField
    v-model="model.token_post_args"
    :add-button-text="t('form.fields.oauth.token_post_args.add_button')"
    :label="t('form.fields.oauth.token_post_args.label')"
    :readonly="readonly"
    test-id-prefix="redis-oauth-token_post_args"
    :tooltip="t('form.fields.oauth.token_post_args.tooltip')"
  />

  <KInput
    v-model="model.timeout"
    data-testid="redis-oauth-timeout-input"
    :label="t('form.fields.oauth.timeout.label')"
    :label-attributes="{
      info: t('form.fields.oauth.timeout.tooltip'),
      tooltipAttributes: { maxWidth: '400' },
    }"
    :readonly="readonly"
    type="number"
  />

  <KCheckbox
    v-model="model.ssl_verify"
    data-testid="redis-oauth-ssl_verify-checkbox"
    :label="t('form.fields.oauth.ssl_verify.label')"
    :label-attributes="{
      info: t('form.fields.oauth.ssl_verify.tooltip'),
      tooltipAttributes: { maxWidth: '400' },
    }"
    :readonly="readonly"
  />

  <VaultSecretPicker
    :config="config"
    :setup="vaultSecretPickerSetup"
    @cancel="() => vaultSecretPickerSetup = false"
    @proceed="handleVaultSecretPickerAutofill"
  />
</template>

<script lang="ts" setup>
import { VaultSecretPicker, VaultSecretPickerProvider } from '@kong-ui-public/entities-vaults'
import '@kong-ui-public/entities-vaults/dist/style.css'
import composables from '../composables'
import { useVaultSecretPicker } from '../composables/useVaultSecretPicker'
import { OauthAuthMethod, OauthClientSecretJwtAlg, OauthGrantType } from '../types'
import StringArrayField from './StringArrayField.vue'
import KeyValueField from './KeyValueField.vue'

import type { SelectItem } from '@kong/kongponents'
import type {
  KongManagerRedisConfigurationFormConfig,
  KonnectRedisConfigurationFormConfig,
  RedisConfigurationFields,
} from '../types'

type OauthConfig = NonNullable<NonNullable<RedisConfigurationFields['config']['cloud_authentication']>['oauth']>

defineProps<{
  config: KonnectRedisConfigurationFormConfig | KongManagerRedisConfigurationFormConfig
  readonly: boolean
}>()
const model = defineModel<OauthConfig>({ required: true })

const { i18n: { t } } = composables.useI18n()
const {
  vaultSecretPickerSetup,
  setUpVaultSecretPicker,
  handleVaultSecretPickerAutofill,
} = useVaultSecretPicker()

interface StringField {
  key: 'client_id' | 'client_secret' | 'password' | 'username' | 'redis_username' | 'redis_username_claim'
  referenceable?: boolean
  encrypted?: boolean
  required?: boolean
}

const stringFields: StringField[] = [
  { key: 'client_id', referenceable: true, required: true },
  { key: 'client_secret', referenceable: true, encrypted: true, required: true },
  { key: 'redis_username', referenceable: true },
  { key: 'redis_username_claim' },
]

const authMethodOptions: SelectItem[] = [
  { label: t('form.options.oauth.auth_method.client_secret_basic'), value: OauthAuthMethod.CLIENT_SECRET_BASIC },
  { label: t('form.options.oauth.auth_method.client_secret_jwt'), value: OauthAuthMethod.CLIENT_SECRET_JWT },
  { label: t('form.options.oauth.auth_method.client_secret_post'), value: OauthAuthMethod.CLIENT_SECRET_POST },
]

const grantTypeOptions: SelectItem[] = [
  { label: t('form.options.oauth.grant_type.client_credentials'), value: OauthGrantType.CLIENT_CREDENTIALS },
  { label: t('form.options.oauth.grant_type.password'), value: OauthGrantType.PASSWORD },
]

const clientSecretJwtAlgOptions: SelectItem[] = [
  { label: t('form.options.oauth.client_secret_jwt_alg.HS256'), value: OauthClientSecretJwtAlg.HS256 },
  { label: t('form.options.oauth.client_secret_jwt_alg.HS512'), value: OauthClientSecretJwtAlg.HS512 },
]
</script>

<style lang="scss" scoped>
.secret-picker-provider {
  margin-top: var(--kui-space-40, $kui-space-40) !important;
}
</style>

<template>
  <DynamicLayout
    v-bind="props"
    :form-config="formConfig"
    :on-form-change="handleFormChange"
    :render-rules="RENDER_RULES"
    :schema="effectiveSchema"
  >
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.client_jwk'"
      >
        <ClientJwkField v-bind="slotProps" />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => genericPath === 'config.token_exchange.subject_token_issuers.*.verify_signature'"
      >
        <VerifySignatureField v-bind="slotProps" />
      </FieldRenderer>
      <!-- Record-array fields whose items are easier to work with as tabs -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => genericPath in TABBED_ARRAY_FIELDS"
      >
        <ArrayField
          v-bind="slotProps"
          appearance="tabs"
          :item-label="(_: unknown, index: number) => tabbedItemLabel(slotProps.name, index)"
        />
      </FieldRenderer>
      <!-- Long free-text / key-material fields -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => TEXTAREA_FIELDS.has(genericPath)"
      >
        <StringField
          v-bind="slotProps"
          multiline
        />
      </FieldRenderer>
      <!-- AI Manager requires an explicit cache token salt; other hosts leave it optional/auto-generated. -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.cache_tokens_salt'"
      >
        <StringField
          v-bind="slotProps"
          :required="isAiManager"
        />
      </FieldRenderer>

      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => genericPath === 'config.token_exchange.subject_token_issuers'"
      >
        <ArrayField
          v-bind="slotProps"
          appearance="tabs"
          :item-label="(_: unknown, index: number) => `#${index + 1} Issuer`"
        />
      </FieldRenderer>
    </template>

    <KTabs :tabs="TABS">
      <template #common-anchor>
        <span data-testid="oidc-tab-common">Common</span>
      </template>
      <template #authorization-anchor>
        <span data-testid="oidc-tab-authorization">Authorization</span>
      </template>
      <template #advanced-anchor>
        <span data-testid="oidc-tab-advanced">Advanced</span>
      </template>

      <template #common>
        <div class="oidc-tab-fields">
          <div class="oidc-tab-header">
            <KExternalLink href="https://developer.konghq.com/plugins/openid-connect/reference/">
              <span class="oidc-tab-header-title">{{ t('plugins.free-form.openid-connect.tabs.common.title') }}</span>
            </KExternalLink>
            <p class="oidc-tab-header-description">
              {{ t('plugins.free-form.openid-connect.tabs.common.description') }}
            </p>
          </div>

          <!-- Konnect with Kong Identity principals support: guided Kong Identity /
               External auth server experience. Auth methods + session management live at
               the bottom of the principals "additional settings" collapse so there is a
               single advanced section. -->
          <PrincipalsSection
            v-if="showPrincipalsUi"
            @click:create-entity="(payload) => emit('click:create-entity', payload)"
            @click:learn-more="(entity) => emit('click:learn-more', entity)"
            @mode-change="principalsMode = $event"
          >
            <AuthMethodsField :principals-mode="principalsMode" />
          </PrincipalsSection>

          <!-- Kong Manager, or no principals support: plain common fields -->
          <template v-else>
            <Field name="config.client_id" />
            <Field name="config.client_secret" />
            <Field name="config.issuer" />
            <AuthMethodsField :principals-mode="principalsMode" />
          </template>
        </div>
      </template>

      <template #authorization>
        <div class="oidc-tab-fields">
          <div class="oidc-tab-header">
            <KExternalLink href="https://developer.konghq.com/plugins/openid-connect/#authorization">
              <span class="oidc-tab-header-title">{{ t('plugins.free-form.openid-connect.tabs.authorization.title') }}</span>
            </KExternalLink>
            <p class="oidc-tab-header-description">
              {{ t('plugins.free-form.openid-connect.tabs.authorization.description') }}
            </p>
          </div>
          <Field name="config.scopes_claim" />
          <Field name="config.scopes_required" />
          <Field name="config.audience_claim" />
          <Field name="config.audience_required" />
          <Field name="config.roles_claim" />
          <Field name="config.roles_required" />
          <Field name="config.groups_claim" />
          <Field name="config.groups_required" />
          <Field name="config.authenticated_groups_claim" />
        </div>
      </template>

      <template #advanced>
        <div class="oidc-tab-fields">
          <div class="oidc-tab-header">
            <KExternalLink href="https://developer.konghq.com/plugins/openid-connect/">
              <span class="oidc-tab-header-title">{{ t('plugins.free-form.openid-connect.tabs.advanced.title') }}</span>
            </KExternalLink>
            <p class="oidc-tab-header-description">
              {{ t('plugins.free-form.openid-connect.tabs.advanced.description') }}
            </p>
          </div>
          <ObjectField
            as-child
            name="config"
            :omit="ADVANCED_OMIT"
          />
        </div>
      </template>
    </KTabs>
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME, FORMS_CONFIG } from '@kong-ui-public/forms'
import { KExternalLink, KTabs } from '@kong/kongponents'
import { computed, inject, onMounted, provide, ref } from 'vue'
import useI18n from '../../../../composables/useI18n'
import { FEATURE_FLAGS } from '../../../../constants'
import DynamicLayout from '../../layout/DynamicLayout.vue'
import { ArrayField, Field, FieldRenderer, ObjectField, StringField, generateCredentialSecret } from '@kong-ui-public/freeform'
import type { FormConfig, FormSchema, RenderRules } from '@kong-ui-public/freeform'
import { FORM_EDITING } from '../../const'
import { usePluginContext } from '../../plugin-context'
import { isLegacyCredentialClaimRuntime, swapCredentialClaimForLegacyRuntime } from './credentialClaimRuntimeSwap'
import { isSingularClaimDeprecated, migrateDeprecatedClaim } from './useDeprecatedClaimMigration'
import AuthMethodsField from './AuthMethodsField.vue'
import ClientJwkField from './ClientJwkField.vue'
import PrincipalsSection from './PrincipalsSection.vue'
import VerifySignatureField from './VerifySignatureField.vue'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { EntityCreateEvent } from '../../../../types'
import type { PrincipalsMode } from './types'
import type { PluginFormLayoutProps as Props } from '../../layout/provider'

const TABS = [
  { hash: '#common', title: 'Common' },
  { hash: '#authorization', title: 'Authorization' },
  { hash: '#advanced', title: 'Advanced' },
] as const

const ADVANCED_OMIT = [
  'client_id',
  'client_secret',
  'issuer',
  'auth_methods',
  'scopes_claim',
  'scopes_required',
  'audience_claim',
  'audience_required',
  'roles_claim',
  'roles_required',
  'groups_claim',
  'groups_required',
  'authenticated_groups_claim',
  // Deprecated in favor of consumer_claims (migrated on mount below); consumer_claims
  // itself stays editable in the Advanced tab.
  'consumer_claim',
  // Kong Identity principals are configured through the guided Common-tab UI on Konnect
  // and are not user-facing elsewhere — never render the bare record.
  'principals',
]

// JWKs are auto-fetched from the issuer when verify_signature is on; a jwks_uri only
// applies as an override, so hide it (and null it out) otherwise. The bundle keeps
// jwks_uri right below verify_signature.
const RENDER_RULES: RenderRules = {
  dependencies: {
    'config.token_exchange.subject_token_issuers.*.jwks_uri':
      ['config.token_exchange.subject_token_issuers.*.verify_signature', true],

    'config.cluster_cache_redis.cloud_authentication.aws_cache_name': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],
    'config.cluster_cache_redis.cloud_authentication.aws_region': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],
    'config.cluster_cache_redis.cloud_authentication.aws_is_serverless': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],
    'config.cluster_cache_redis.cloud_authentication.aws_access_key_id': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],
    'config.cluster_cache_redis.cloud_authentication.aws_secret_access_key': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],
    'config.cluster_cache_redis.cloud_authentication.aws_assume_role_arn': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],
    'config.cluster_cache_redis.cloud_authentication.aws_role_session_name': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'aws'],

    'config.cluster_cache_redis.cloud_authentication.gcp_service_account_json': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'gcp'],

    'config.cluster_cache_redis.cloud_authentication.azure_client_id': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'azure'],
    'config.cluster_cache_redis.cloud_authentication.azure_client_secret': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'azure'],
    'config.cluster_cache_redis.cloud_authentication.azure_tenant_id': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'azure'],

    'config.cluster_cache_redis.cloud_authentication.oauth': ['config.cluster_cache_redis.cloud_authentication.auth_provider', 'oauth'],
    'config.cluster_cache_redis.cloud_authentication.oauth.username': ['config.cluster_cache_redis.cloud_authentication.oauth.grant_type', 'password'],
    'config.cluster_cache_redis.cloud_authentication.oauth.password': ['config.cluster_cache_redis.cloud_authentication.oauth.grant_type', 'password'],

    'config.redis': ['config.session_storage', 'redis'],
  },
  bundles: [
    [
      'config.token_exchange.subject_token_issuers.*.verify_signature',
      'config.token_exchange.subject_token_issuers.*.jwks_uri',
    ],
    ['config.session_storage', 'config.redis'],
  ],
}

const { i18n: { t } } = useI18n()

const props = defineProps<Props>()

const emit = defineEmits<{
  'click:learn-more': [entity: string]
  'click:create-entity': [payload: EntityCreateEvent]
}>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
provide(FORM_EDITING, computed(() => props.isEditing))

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')

// AI Manager relies on cache_tokens_salt to key its own token cache, so it must be
// explicitly set rather than left to Kong's auto-generation.
const openidConnectContext = usePluginContext('openid-connect')
const isAiManager = computed(() => openidConnectContext?.source === 'ai-manager')

// Feature-flagged: when the consuming app hasn't enabled the Identity Principals UI,
// behave as if `principals` isn't in the schema and fall back to the plain common fields.
const identityPrincipalsUiEnabled = inject<boolean>(FEATURE_FLAGS.KHCP_20393_IDENTITY_PRINCIPALS_UI, false)

const configSchema = computed(() =>
  props.schema.fields.find(f => 'config' in f)?.config as {
    fields?: Array<Record<string, any>>
    shorthand_fields?: Array<Record<string, any>>
  } | undefined,
)

const configSchemaFields = computed(() => configSchema.value?.fields)

const hasPrincipalsInSchema = computed(() =>
  !!configSchemaFields.value?.some(f => 'principals' in f),
)

const showPrincipalsUi = computed(() =>
  isKonnect.value && identityPrincipalsUiEnabled && hasPrincipalsInSchema.value,
)

// Set by the user toggling the Kong Identity / External radios; stays null on edit-load
// so AuthMethodsField falls back to inferring the restriction from the saved issuer.
const principalsMode = ref<PrincipalsMode | null>(null)

// JWK members (alg, kid, x5t, ...) are case-sensitive technical identifiers — show the
// raw field name instead of the prettified label.
const CLIENT_JWK_ITEM_PATH = /^(?:\$\.)?config\.client_jwk\.\d+\.([^.]+)$/
// Spread the host's form config so its settings (notably the AI Gateway
// `minRuntimeVersion`) reach the form engine; the JWK label transform stays local.
const formConfig = computed<FormConfig>(() => ({
  ...(props.formConfig as FormConfig | undefined),
  transformLabel: (label, fieldPath) => CLIENT_JWK_ITEM_PATH.exec(fieldPath)?.[1] ?? label,
}))

// AI Gateway 2.3 is the first runtime that understands credential_claims; older
// runtimes only know the deprecated credential_claim. When the host pins such a
// runtime, the form swaps the pair (see credentialClaimRuntimeSwap.ts):
// credential_claims drops out of the schema (it neither renders nor ships in
// the payload) and the deprecated credential_claim is lifted from
// shorthand_fields back into config.fields — with its pre-deprecation default
// when the schema records one (deprecation.old_default). Absent version info
// (API Gateway) fails open to the plural-only behavior.
const minRuntimeVersion = computed(() =>
  openidConnectContext?.minRuntimeVersion ?? formConfig.value.minRuntimeVersion,
)
const showLegacyCredentialClaim = computed(() =>
  isLegacyCredentialClaimRuntime(minRuntimeVersion.value),
)
const effectiveSchema = computed<FormSchema>(() =>
  swapCredentialClaimForLegacyRuntime(props.schema, showLegacyCredentialClaim.value),
)

// The config record of the schema the form actually renders (post-swap). The
// migration loop must consult this, not the raw schema: in AIGW legacy mode the
// swap removes credential_claims, so the forward migration correctly never
// fires there — the runtime only understands the singular.
const effectiveConfigSchema = computed(() =>
  (effectiveSchema.value.fields.find(f => 'config' in f)?.config as {
    fields?: Array<Record<string, any>>
    shorthand_fields?: Array<Record<string, any>>
  } | undefined),
)

// The last full engine change handleFormChange forwarded — the freshest base
// for mount-time config updates.
let lastFullFormValue: Partial<Props['model']> | undefined

// Pre-2.3 runtimes reject the unknown plural field, so it must never ship —
// including a credential_claims saved earlier against a newer runtime.
const handleFormChange = (value: Partial<Props['model']>, fields?: string[]) => {
  lastFullFormValue = value

  if (!showLegacyCredentialClaim.value) {
    return props.onFormChange(value, fields)
  }

  const config = { ...((value as Record<string, any>)?.config ?? {}) }
  delete config.credential_claims

  props.onFormChange({ ...value, config } as Partial<Props['model']>, fields)
}

// Mount-time config updates (deprecated-claim migrations, the ai-manager salt
// prefill) must ship inside a complete config: hosts that replace form state
// wholesale (PluginEntityForm) would collapse a bare partial to it and wipe
// every other config field on save. Base it on the last full engine value when
// one has flowed, else on the initial model.
const emitMountConfigUpdate = (patch: Record<string, any>) => {
  const base = (lastFullFormValue as Record<string, any> | undefined)?.config
    ?? (props.model as Record<string, any>)?.config
    ?? {}
  handleFormChange({ config: { ...base, ...patch } } as Partial<Props['model']>)
}

// Record-array fields rendered with the tabbed ArrayField, mapped to their item tab
// titles ('#1 Upstream header', ... matching ClientJwkField's tab titles).
const TABBED_ARRAY_FIELDS: Record<string, string> = {
  'config.upstream_headers': 'Upstream header',
  'config.downstream_headers': 'Downstream header',
  'config.redis.sentinel_nodes': 'Sentinel node',
  'config.redis.cluster_nodes': 'Cluster node',
  'config.cluster_cache_redis.sentinel_nodes': 'Sentinel node',
  'config.cluster_cache_redis.cluster_nodes': 'Cluster node',
}

function tabbedItemLabel(name: string, index: number): string {
  const path = name.startsWith('$.') ? name.slice(2) : name
  return `#${index + 1} ${TABBED_ARRAY_FIELDS[path]}`
}

// Fields holding long free text or base64(url) key material — rendered as textareas.
const TEXTAREA_FIELDS = new Set([
  // Error response bodies
  'config.unauthorized_error_message',
  'config.forbidden_error_message',
  // JWK key-material members (RSA modulus/exponents, EC coordinates, symmetric keys)
  // Note: these fields are encrypted in the schema, textarea can not be masked, keep them as password input now.
  // 'config.client_jwk.*.d',
  // 'config.client_jwk.*.dp',
  // 'config.client_jwk.*.dq',
  // 'config.client_jwk.*.k',
  // 'config.client_jwk.*.n',
  // 'config.client_jwk.*.oth',
  // 'config.client_jwk.*.p',
  // 'config.client_jwk.*.q',
  // 'config.client_jwk.*.qi',
  // 'config.client_jwk.*.r',
  // 'config.client_jwk.*.t',
  // 'config.client_jwk.*.x',
  // 'config.client_jwk.*.y',
  // Each x5c chain entry is a full base64 DER certificate
  'config.client_jwk.*.x5c.*',
])

onMounted(() => {
  const config = (props.model as any)?.config

  // Migrate deprecated singular claim fields to their plural replacements:
  // credential_claim → credential_claims, consumer_claim → consumer_claims.
  // Only when the schema formally deprecates the singular — its shorthand_fields
  // entry is marked deprecated with replaced_with pointing at the plural — AND
  // the plural actually renders (checked against the effective, post-swap
  // schema: in AIGW legacy mode credential_claims is swapped out, so the
  // forward migration correctly never fires there). Stale schemas still carry
  // the singular as a regular field: migrating there would submit an unknown
  // field the gateway rejects, so it keeps showing and saving the singular
  // unchanged.
  for (const [claimField, claimsField] of [
    ['credential_claim', 'credential_claims'],
    ['consumer_claim', 'consumer_claims'],
  ] as const) {
    if (
      !isSingularClaimDeprecated(effectiveConfigSchema.value?.shorthand_fields, claimField, claimsField)
      || !effectiveConfigSchema.value?.fields?.some(f => claimsField in f)
    ) {
      continue
    }
    const migratedClaims = migrateDeprecatedClaim({
      claim: config?.[claimField],
      claims: config?.[claimsField],
    })
    if (migratedClaims !== null) {
      emitMountConfigUpdate({ [claimsField]: migratedClaims })
    }
  }

  // AIGW runtime < 2.3: a credential_claims saved against a newer runtime is
  // invisible in legacy mode (no schema field) — map its first claim path back
  // into the deprecated credential_claim the runtime understands, mirroring
  // the server's own reverse mapping (first entry wins). emitMountConfigUpdate
  // delivers it inside a complete config.
  if (showLegacyCredentialClaim.value && !config?.credential_claim) {
    const savedClaims = config?.credential_claims
    const firstClaim = Array.isArray(savedClaims) && savedClaims.length > 0 ? savedClaims[0] : null
    if (firstClaim) {
      emitMountConfigUpdate({
        credential_claim: Array.isArray(firstClaim) ? firstClaim : [firstClaim],
      })
    }
  }

  // AI Manager needs a real salt from the start (not Kong's server-generated one) so it
  // can key its token cache before the plugin is ever saved.
  if (isAiManager.value && !props.isEditing && !config?.cache_tokens_salt) {
    emitMountConfigUpdate({ cache_tokens_salt: generateCredentialSecret(32) })
  }
})
</script>

<style lang="scss" scoped>
.oidc-tab-fields {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);
}

.oidc-tab-header {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  &-title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  &-description {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    margin: 0;
  }
}
</style>

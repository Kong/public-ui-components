<template>
  <DynamicLayout
    v-bind="props"
    :form-config="formConfig"
    :render-rules="RENDER_RULES"
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
import { cloneDeep } from 'lodash-es'
import { computed, inject, onMounted, provide, ref } from 'vue'
import useI18n from '../../../../composables/useI18n'
import { FEATURE_FLAGS } from '../../../../constants'
import DynamicLayout from '../../shared/layout/DynamicLayout.vue'
import ArrayField from '../../shared/ArrayField.vue'
import Field from '../../shared/Field.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import ObjectField from '../../shared/ObjectField.vue'
import StringField from '../../shared/StringField.vue'
import { FORM_EDITING } from '../../shared/const'
import { resetEmptyTokenExchange } from '../../../../definitions/schemas/OIDC'
import { migrateConsumerClaim } from './useConsumerClaimMigration'
import AuthMethodsField from './AuthMethodsField.vue'
import ClientJwkField from './ClientJwkField.vue'
import PrincipalsSection from './PrincipalsSection.vue'
import VerifySignatureField from './VerifySignatureField.vue'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { EntityCreateEvent } from '../../../../types'
import type { FormConfig, RenderRules } from '../../shared/types'
import type { PrincipalsMode } from './types'
import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'

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
  },
  bundles: [
    [
      'config.token_exchange.subject_token_issuers.*.verify_signature',
      'config.token_exchange.subject_token_issuers.*.jwks_uri',
    ],
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

// Feature-flagged: when the consuming app hasn't enabled the Identity Principals UI,
// behave as if `principals` isn't in the schema and fall back to the plain common fields.
const identityPrincipalsUiEnabled = inject<boolean>(FEATURE_FLAGS.KHCP_20393_IDENTITY_PRINCIPALS_UI, false)

const hasPrincipalsInSchema = computed(() => {
  const configField = props.schema.fields.find(f => 'config' in f)?.config as { fields?: Array<Record<string, unknown>> } | undefined
  return !!configField?.fields?.some(f => 'principals' in f)
})

const showPrincipalsUi = computed(() =>
  isKonnect.value && identityPrincipalsUiEnabled && hasPrincipalsInSchema.value,
)

// Set by the user toggling the Kong Identity / External radios; stays null on edit-load
// so AuthMethodsField falls back to inferring the restriction from the saved issuer.
const principalsMode = ref<PrincipalsMode | null>(null)

// JWK members (alg, kid, x5t, ...) are case-sensitive technical identifiers — show the
// raw field name instead of the prettified label.
const CLIENT_JWK_ITEM_PATH = /^(?:\$\.)?config\.client_jwk\.\d+\.([^.]+)$/
const formConfig: FormConfig = {
  transformLabel: (label, fieldPath) => CLIENT_JWK_ITEM_PATH.exec(fieldPath)?.[1] ?? label,
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
  'config.client_jwk.*.d',
  'config.client_jwk.*.dp',
  'config.client_jwk.*.dq',
  'config.client_jwk.*.k',
  'config.client_jwk.*.n',
  'config.client_jwk.*.oth',
  'config.client_jwk.*.p',
  'config.client_jwk.*.q',
  'config.client_jwk.*.qi',
  'config.client_jwk.*.r',
  'config.client_jwk.*.t',
  'config.client_jwk.*.x',
  'config.client_jwk.*.y',
  // Each x5c chain entry is a full base64 DER certificate
  'config.client_jwk.*.x5c.*',
])

onMounted(() => {
  const config = (props.model as any)?.config

  // Migrate deprecated consumer_claim → consumer_claims
  const migratedClaims = migrateConsumerClaim({
    consumer_claim: config?.consumer_claim,
    consumer_claims: config?.consumer_claims,
  })
  if (migratedClaims !== null) {
    props.onFormChange({ config: { consumer_claims: migratedClaims } } as any)
  }

  // token_exchange cleanup — null out default-shaped token_exchange objects
  const originalTokenExchange = config?.token_exchange ?? null
  const tokenExchangeWrapper = { token_exchange: cloneDeep(originalTokenExchange) }
  resetEmptyTokenExchange(tokenExchangeWrapper as any)

  const cleanupPayload: Record<string, any> = {}
  let needsCleanup = false

  if (tokenExchangeWrapper.token_exchange === null && originalTokenExchange !== null) {
    cleanupPayload.token_exchange = null
    needsCleanup = true
  }

  // proof_of_possession_mtls_from_header cleanup — null out when ca_certificates is absent or empty
  const mtls = config?.proof_of_possession_mtls_from_header
  if (mtls) {
    const ca = mtls.ca_certificates
    if (!ca || (Array.isArray(ca) && ca.length === 0)) {
      cleanupPayload.proof_of_possession_mtls_from_header = null
      needsCleanup = true
    }
  }

  if (needsCleanup) {
    props.onFormChange({ config: cleanupPayload } as any)
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

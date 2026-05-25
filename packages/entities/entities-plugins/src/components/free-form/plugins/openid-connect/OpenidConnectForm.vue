<template>
  <StandardLayout
    v-bind="props"
    :on-form-change="wrappedOnFormChange"
  >
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
          <Field name="config.client_id" />
          <Field name="config.client_secret" />
          <Field name="config.issuer" />
          <div
            v-for="[value, label] in AUTH_METHOD_ENTRIES"
            :key="value"
            :data-testid="`oidc-auth-method-${value}`"
          >
            <KCheckbox
              :model-value="authMethods.includes(value)"
              @update:model-value="(checked) => handleAuthMethodChange(value, checked)"
            >
              {{ label }}
            </KCheckbox>
          </div>
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
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { KCheckbox, KExternalLink, KTabs } from '@kong/kongponents'
import { cloneDeep } from 'lodash-es'
import { onMounted, provide, ref } from 'vue'
import useI18n from '../../../../composables/useI18n'
import StandardLayout from '../../shared/layout/StandardLayout.vue'
import Field from '../../shared/Field.vue'
import ObjectField from '../../shared/ObjectField.vue'
import type { Props } from '../../shared/layout/StandardLayout.vue'
import { resetEmptyTokenExchange } from '../../../../definitions/schemas/OIDC'
import { migrateConsumerClaim } from './useConsumerClaimMigration'

const AUTH_METHOD_LABELS: Record<string, string> = {
  password: 'Passwords Grant',
  client_credentials: 'Client Credentials Grant',
  authorization_code: 'Authorization Code Flow',
  bearer: 'Bearer Access Token',
  introspection: 'Introspection',
  userinfo: 'UserInfo',
  kong_oauth2: 'Kong OAuth',
  refresh_token: 'Refresh Token',
  session: 'Enable Session Management',
}

const AUTH_METHOD_ENTRIES = Object.entries(AUTH_METHOD_LABELS)

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
  'consumer_claim',
  'consumer_claims',
]

const { i18n: { t } } = useI18n()

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const authMethods = ref<string[]>((props.model as any)?.config?.auth_methods ?? [])

function wrappedOnFormChange(value: any, fields?: string[]) {
  props.onFormChange({
    ...value,
    config: {
      ...value.config,
      auth_methods: authMethods.value,
    },
  }, fields)
}

function handleAuthMethodChange(method: string, checked: boolean) {
  if (checked) {
    if (!authMethods.value.includes(method)) {
      authMethods.value = [...authMethods.value, method]
    }
  } else {
    authMethods.value = authMethods.value.filter(m => m !== method)
  }
  props.onFormChange({ config: { auth_methods: authMethods.value } } as any)
}

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

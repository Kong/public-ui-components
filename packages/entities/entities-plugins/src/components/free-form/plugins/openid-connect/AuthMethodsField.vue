<template>
  <!-- Konnect: multiselect + explicit "Use sessions / Do not use sessions" radios -->
  <div
    v-if="isKonnect"
    class="oidc-auth-methods"
  >
    <KLabel>{{ t('plugins.free-form.openid-connect.auth_methods.label') }}</KLabel>
    <KMultiselect
      :key="principalsMode ?? 'initial'"
      class="auth-methods-multiselect"
      data-testid="auth-methods-multiselect"
      :items="authMethodItems"
      :model-value="selectedAuthMethods"
      :placeholder="t('plugins.free-form.openid-connect.auth_methods.placeholder')"
      @update:model-value="handleMethodsSelect"
    />
    <p class="auth-methods-hint">
      {{ t('plugins.free-form.openid-connect.auth_methods.hint') }}
    </p>

    <div class="session-management-section">
      <KLabel>{{ t('plugins.free-form.openid-connect.auth_methods.session.label') }}</KLabel>
      <div class="session-radio-group">
        <KRadio
          data-testid="session-radio-use"
          :description="t('plugins.free-form.openid-connect.auth_methods.session.use_description')"
          :label="t('plugins.free-form.openid-connect.auth_methods.session.use_label')"
          :model-value="sessionEnabled"
          :selected-value="true"
          @change="handleSessionChange(true)"
        />
        <KRadio
          data-testid="session-radio-no-use"
          :description="t('plugins.free-form.openid-connect.auth_methods.session.no_use_description')"
          :label="t('plugins.free-form.openid-connect.auth_methods.session.no_use_label')"
          :model-value="sessionEnabled"
          :selected-value="false"
          @change="handleSessionChange(false)"
        />
      </div>
    </div>
  </div>

  <!-- Kong Manager: checkbox list + separate session switch -->
  <div
    v-else
    class="oidc-auth-methods"
  >
    <KLabel>{{ t('plugins.free-form.openid-connect.auth_methods.km_label') }}</KLabel>
    <div class="auth-method-container">
      <div
        v-for="item in authMethodItems"
        :key="item.value"
        class="auth-method"
      >
        <KCheckbox
          :data-testid="`auth-method-checkbox-${item.value}`"
          :model-value="selectedAuthMethods.includes(item.value)"
          @update:model-value="(checked: boolean) => handleMethodToggle(item.value, checked)"
        >
          {{ item.label }}
        </KCheckbox>
      </div>
    </div>
    <KInputSwitch
      data-testid="session-management-switch"
      :label="t('plugins.free-form.openid-connect.auth_methods.session.switch_label')"
      :model-value="sessionEnabled"
      @update:model-value="handleSessionChange"
    />
  </div>
</template>

<script lang="ts">
export const AUTH_METHODS = [
  'authorization_code',
  'bearer',
  'client_credentials',
  'password',
  'introspection',
  'userinfo',
  'kong_oauth2',
  'refresh_token',
] as const

export const KONG_IDENTITY_METHODS = ['bearer', 'client_credentials', 'introspection', 'userinfo']

// Kong Identity auth servers are hosted under the identity.konghq domain; an issuer that
// does not match is an external IdP. Used to restrict auth methods when no explicit
// principals mode has been set (e.g. on edit-load).
export const KONG_IDENTITY_ISSUER_MARKER = 'identity.konghq'

export const isKongIdentityIssuer = (issuer: unknown): boolean =>
  typeof issuer === 'string' && issuer.includes(KONG_IDENTITY_ISSUER_MARKER)
</script>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { KCheckbox, KInputSwitch, KLabel, KMultiselect, KRadio } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import useI18n from '../../../../composables/useI18n'
import { useFormShared } from '../../shared/composables'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { OidcConfigSubset, PrincipalsMode } from './types'

const props = defineProps<{
  /**
   * Principals mode set by the user toggling the Kong Identity / External radios.
   * Stays `null` on edit-load (no explicit toggle), in which case the saved issuer
   * decides whether the Kong Identity restriction applies.
   */
  principalsMode?: PrincipalsMode | null
}>()

const { i18n: { t } } = useI18n()

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')

// Read/write formData directly instead of useFormData(): the latter provides its own
// field path to descendants, which would corrupt relative path resolution for anything
// rendered below this component.
const { formData } = useFormShared<FreeFormPluginData<OidcConfigSubset>>()
const authMethods = computed(() => formData.config?.auth_methods ?? null)

const methodLabels = computed<Record<string, string>>(() => ({
  authorization_code: t('plugins.free-form.openid-connect.auth_methods.methods.authorization_code'),
  bearer: t('plugins.free-form.openid-connect.auth_methods.methods.bearer'),
  client_credentials: t('plugins.free-form.openid-connect.auth_methods.methods.client_credentials'),
  password: t('plugins.free-form.openid-connect.auth_methods.methods.password'),
  introspection: t('plugins.free-form.openid-connect.auth_methods.methods.introspection'),
  userinfo: t('plugins.free-form.openid-connect.auth_methods.methods.userinfo'),
  kong_oauth2: t('plugins.free-form.openid-connect.auth_methods.methods.kong_oauth2'),
  refresh_token: t('plugins.free-form.openid-connect.auth_methods.methods.refresh_token'),
}))

const isKongIdentity = computed(() => {
  if (props.principalsMode !== null && props.principalsMode !== undefined) {
    return props.principalsMode === 'kong-identity'
  }
  return isKongIdentityIssuer(formData.config?.issuer)
})

const authMethodItems = computed(() => {
  // The Kong Identity restriction is a Konnect-only concept; Kong Manager always
  // offers the full list.
  const methods = isKonnect.value && isKongIdentity.value
    ? AUTH_METHODS.filter(m => KONG_IDENTITY_METHODS.includes(m))
    : AUTH_METHODS
  return methods.map(value => ({ value, label: methodLabels.value[value] }))
})

const selectedAuthMethods = computed(() =>
  (authMethods.value ?? []).filter(m => m !== 'session'),
)

const sessionEnabled = computed(() => (authMethods.value ?? []).includes('session'))

function writeAuthMethods(methods: string[], session: boolean) {
  if (!formData.config) return
  formData.config.auth_methods = session ? [...methods, 'session'] : [...methods]
}

function handleMethodsSelect(selected: string[]) {
  writeAuthMethods(selected, sessionEnabled.value)
}

function handleMethodToggle(method: string, checked: boolean) {
  const next = checked
    ? [...new Set([...selectedAuthMethods.value, method])]
    : selectedAuthMethods.value.filter(m => m !== method)
  writeAuthMethods(next, sessionEnabled.value)
}

function handleSessionChange(enabled: boolean) {
  writeAuthMethods(selectedAuthMethods.value, enabled)
}
</script>

<style lang="scss" scoped>
.oidc-auth-methods {
  :deep(.k-label) {
    margin-top: 0;
  }
}

.auth-methods-multiselect {
  margin-bottom: var(--kui-space-40, $kui-space-40);
}

.auth-methods-hint {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  margin: var(--kui-space-20, $kui-space-20) 0 0;
}

// Separate "Session management" from "Authentication methods" with the same gap the
// collapse uses between its field groups, so the rhythm stays consistent.
.session-management-section {
  margin-top: var(--kui-space-70, $kui-space-70);

  .k-label {
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }
}

.session-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}

.auth-method-container {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--kui-space-40, $kui-space-40);

  .auth-method {
    margin-bottom: var(--kui-space-30, $kui-space-30);
    width: 50%;
  }
}
</style>

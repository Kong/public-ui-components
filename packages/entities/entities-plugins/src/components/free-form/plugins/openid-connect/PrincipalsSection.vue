<template>
  <div
    class="oidc-principals-section"
    data-testid="oidc-principals-section"
  >
    <div class="principals-header">
      {{ t('plugins.free-form.openid-connect.principals.header') }}
    </div>
    <div class="principals-description">
      {{ t('plugins.free-form.openid-connect.principals.description') }}
      <KExternalLink href="https://developer.konghq.com/plugins/openid-connect/">
        {{ t('plugins.free-form.openid-connect.principals.learn_more') }}
      </KExternalLink>
    </div>

    <div
      class="oidc-auth-mode-radio-group"
      data-testid="oidc-auth-mode-radio-group"
    >
      <KRadio
        v-model="selectedMode"
        card
        card-orientation="horizontal"
        data-testid="oidc-auth-mode-kong-identity"
        :selected-value="MODE_KONG_IDENTITY"
        @change="handleModeChange"
      >
        <div class="auth-mode-card-content">
          <KeyIcon :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`" />
          <div class="auth-mode-card-label">
            {{ t('plugins.free-form.openid-connect.principals.kong_identity_label') }}
          </div>
          <div class="auth-mode-card-description">
            {{ t('plugins.free-form.openid-connect.principals.kong_identity_description') }}
          </div>
        </div>
      </KRadio>
      <KRadio
        v-model="selectedMode"
        card
        card-orientation="horizontal"
        data-testid="oidc-auth-mode-external"
        :selected-value="MODE_EXTERNAL"
        @change="handleModeChange"
      >
        <div class="auth-mode-card-content">
          <WorldIcon :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`" />
          <div class="auth-mode-card-label">
            {{ t('plugins.free-form.openid-connect.principals.external_label') }}
          </div>
          <div class="auth-mode-card-description">
            {{ t('plugins.free-form.openid-connect.principals.external_description') }}
          </div>
        </div>
      </KRadio>
    </div>

    <!-- While the first directory/principals lookup is in flight, show a skeleton in place of
         the guide (cold fetch only — cached refreshes stay silent). -->
    <KSkeleton
      v-if="principalsSkeletonVisible && selectedMode === MODE_KONG_IDENTITY"
      class="principals-create-guide-skeleton"
      data-testid="principals-create-guide-loading"
    />
    <!-- Add/Create Principals guide: principal lookup runs after token verification in
         either mode, so the empty-directory guide applies to Kong Identity and External alike. -->
    <div
      v-else-if="principalsGuideVisible && selectedMode === MODE_KONG_IDENTITY"
      class="principals-create-guide"
      data-testid="principals-create-guide"
    >
      <div class="principals-create-guide-title">
        {{ t('plugins.free-form.openid-connect.principals.guide.title') }}
      </div>
      <div class="principals-create-guide-description">
        {{ t('plugins.free-form.openid-connect.principals.guide.description') }}
      </div>
      <div class="principals-create-guide-actions">
        <KButton
          appearance="primary"
          data-testid="principals-create-principal"
          @click="leavePromptType = 'principal'"
        >
          <AddIcon decorative />
          {{ t('plugins.free-form.openid-connect.principals.guide.create') }}
        </KButton>
        <KButton
          appearance="secondary"
          data-testid="principals-learn-more"
          @click="$emit('click:learn-more', 'kong-identity')"
        >
          <BookIcon decorative />
          {{ t('plugins.free-form.openid-connect.principals.guide.learn_more') }}
        </KButton>
      </div>
    </div>

    <template v-if="selectedMode === MODE_KONG_IDENTITY">
      <KSelect
        v-if="hasAuthServersAccess"
        class="principals-directory-select"
        data-testid="principals-directory-select"
        enable-filtering
        :items="kongIdentityServerItems"
        :label="t('plugins.free-form.openid-connect.principals.auth_server.label')"
        :label-attributes="{
          info: t('plugins.free-form.openid-connect.principals.auth_server.info'),
          tooltipAttributes: { maxWidth: '300' },
        }"
        :loading="kongIdentityServersLoading"
        :model-value="selectedServer?.id"
        :placeholder="t('plugins.free-form.openid-connect.principals.auth_server.placeholder')"
        required
        @update:model-value="handleServerChange"
      >
        <template
          v-if="canCreateAuthServer"
          #dropdown-footer-text
        >
          <div
            class="create-action"
            data-testid="create-auth-server-action"
            @click.stop="leavePromptType = 'authServer'"
          >
            <AddIcon :size="`var(--kui-icon-size-20, ${KUI_ICON_SIZE_20})`" />
            <div class="create-action-content">
              <span>{{ t('plugins.free-form.openid-connect.principals.auth_server.create') }}</span>
              <div class="create-action-hint">
                {{ t('plugins.free-form.openid-connect.principals.auth_server.create_hint') }}
              </div>
            </div>
          </div>
        </template>
      </KSelect>
      <KInput
        v-else
        data-testid="kong-identity-issuer-input"
        :help="t('plugins.free-form.openid-connect.principals.auth_server.no_access_help')"
        :label="t('plugins.free-form.openid-connect.principals.auth_server.label')"
        :label-attributes="{
          info: t('plugins.free-form.openid-connect.principals.auth_server.info'),
          tooltipAttributes: { maxWidth: '300' },
        }"
        :model-value="issuer ?? undefined"
        :placeholder="t('plugins.free-form.openid-connect.principals.auth_server.issuer_placeholder')"
        required
        @update:model-value="issuer = $event"
      />

      <div
        v-for="(clientId, index) in clientIdArray"
        :key="index"
        class="client-row"
        :class="{ 'client-row-with-label': index === 0 }"
      >
        <KInput
          v-if="!hasAuthServersAccess"
          class="principals-client-select"
          data-testid="principals-client-id-input"
          :label="index === 0 ? t('plugins.free-form.openid-connect.principals.client.label') : undefined"
          :model-value="clientId ?? undefined"
          :placeholder="t('plugins.free-form.openid-connect.principals.client.id_placeholder')"
          @update:model-value="handleClientChange(index, $event)"
        />
        <KSelect
          v-else
          class="principals-client-select"
          data-testid="principals-client-select"
          :disabled="!selectedServer"
          enable-filtering
          :items="getClientItemsForRow(index)"
          :label="index === 0 ? t('plugins.free-form.openid-connect.principals.client.label') : undefined"
          :loading="clientsLoading"
          :model-value="clientId ?? undefined"
          :placeholder="t('plugins.free-form.openid-connect.principals.client.placeholder')"
          @update:model-value="handleClientChange(index, $event)"
        >
          <template
            v-if="canCreateAuthServerClient"
            #dropdown-footer-text
          >
            <div
              class="create-action"
              data-testid="create-client-action"
              @click.stop="leavePromptType = 'client'"
            >
              <AddIcon :size="`var(--kui-icon-size-20, ${KUI_ICON_SIZE_20})`" />
              <div class="create-action-content">
                <span>{{ t('plugins.free-form.openid-connect.principals.client.create') }}</span>
                <div class="create-action-hint">
                  {{ t('plugins.free-form.openid-connect.principals.client.create_hint') }}
                </div>
              </div>
            </div>
          </template>
        </KSelect>
        <div class="principals-client-secret-wrapper">
          <KInput
            class="principals-client-secret"
            data-testid="principals-client-secret"
            :disabled="hasAuthServersAccess && !selectedServer"
            :label="index === 0 ? t('plugins.free-form.openid-connect.principals.client.secret_label') : undefined"
            :model-value="clientSecretArray[index] ?? undefined"
            :placeholder="t('plugins.free-form.openid-connect.principals.client.secret_placeholder')"
            show-password-mask-toggle
            type="password"
            @update:model-value="handleClientSecretChange(index, $event)"
          />
          <component
            :is="autofillSlot"
            v-if="autofillSlot"
            :schema="{ model: 'config-client_secret', referenceable: true }"
            :update="(val: string) => handleClientSecretChange(index, val)"
            :value="clientSecretArray[index]"
          />
        </div>
        <button
          :aria-label="t('plugins.free-form.openid-connect.principals.client.remove')"
          class="remove-client-btn"
          data-testid="remove-client-action"
          :disabled="isRemoveClientDisabled"
          type="button"
          @click="removeClientRow(index)"
        >
          <CloseIcon :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`" />
        </button>
      </div>

      <div
        class="add-client-inline"
        :class="{ 'add-client-inline-disabled': hasAuthServersAccess && !selectedServer }"
        data-testid="add-client-action"
        @click="(hasAuthServersAccess && !selectedServer) ? null : addClientRow()"
      >
        {{ t('plugins.free-form.openid-connect.principals.client.add') }}
      </div>

      <!-- Principal lookup is opt-in (off by default) in Kong Identity mode too: the
           in-collapse toggle enables it, then it runs after token verification. -->
      <PrincipalLookupSettings
        :data-plane-incompatible="hasIncompatibleDataPlane"
        :on-enabled-change="handleUsePrincipalLookupChange"
      >
        <slot />
      </PrincipalLookupSettings>
    </template>

    <template v-else>
      <div
        v-for="(clientId, index) in clientIdArray"
        :key="index"
        class="client-row"
        :class="{ 'client-row-with-label': index === 0 }"
      >
        <div class="external-client-field">
          <KInput
            class="external-client-input"
            data-testid="external-client-id"
            :label="index === 0 ? t('plugins.free-form.openid-connect.principals.client.id_label') : undefined"
            :model-value="clientId ?? undefined"
            :placeholder="t('plugins.free-form.openid-connect.principals.client.id_placeholder')"
            @update:model-value="handleClientChange(index, $event)"
          >
            <!-- Schema help text is markdown-rendered, sanitized HTML — render it via the
                 label tooltip slot (labelAttributes.info is plain-text only). -->
            <template
              v-if="index === 0 && clientIdInfo"
              #label-tooltip
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="clientIdInfo" />
            </template>
          </KInput>
          <component
            :is="autofillSlot"
            v-if="autofillSlot"
            :schema="{ model: 'config-client_id', referenceable: true }"
            :update="(val: string) => handleClientChange(index, val)"
            :value="clientId"
          />
        </div>
        <div class="external-client-field">
          <KInput
            class="external-client-input"
            data-testid="external-client-secret"
            :label="index === 0 ? t('plugins.free-form.openid-connect.principals.client.secret_label') : undefined"
            :model-value="clientSecretArray[index] ?? undefined"
            :placeholder="t('plugins.free-form.openid-connect.principals.client.secret_placeholder')"
            show-password-mask-toggle
            type="password"
            @update:model-value="handleClientSecretChange(index, $event)"
          >
            <template
              v-if="index === 0 && clientSecretInfo"
              #label-tooltip
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="clientSecretInfo" />
            </template>
          </KInput>
          <component
            :is="autofillSlot"
            v-if="autofillSlot"
            :schema="{ model: 'config-client_secret', referenceable: true }"
            :update="(val: string) => handleClientSecretChange(index, val)"
            :value="clientSecretArray[index]"
          />
        </div>
        <button
          :aria-label="t('plugins.free-form.openid-connect.principals.client.remove')"
          class="remove-client-btn"
          data-testid="remove-external-client-action"
          :disabled="clientIdArray.length <= 1"
          type="button"
          @click="removeClientRow(index)"
        >
          <CloseIcon :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`" />
        </button>
      </div>

      <div
        class="add-client-inline"
        data-testid="add-external-client-action"
        @click="addClientRow()"
      >
        {{ t('plugins.free-form.openid-connect.principals.client.add') }}
      </div>

      <Field name="config.issuer" />

      <PrincipalLookupSettings
        :data-plane-incompatible="hasIncompatibleDataPlane"
        :on-enabled-change="handleUsePrincipalLookupChange"
      >
        <!-- No directory / no principals: guide the user to set up Kong Identity, inside the
             additional settings (the toggle above is disabled in this state). -->
        <template #banner>
          <KSkeleton
            v-if="principalsCreationGuideVisible === undefined"
            class="principals-create-guide-skeleton"
            data-testid="principals-create-guide-loading"
          />
          <div
            v-else-if="principalsCreationGuideVisible"
            class="principals-create-guide"
            data-testid="principals-create-guide"
          >
            <div class="principals-create-guide-title">
              {{ t('plugins.free-form.openid-connect.principals.guide.title') }}
            </div>
            <div class="principals-create-guide-description">
              {{ t('plugins.free-form.openid-connect.principals.guide.description_external') }}
            </div>
            <div class="principals-create-guide-actions">
              <KButton
                appearance="primary"
                data-testid="principals-create-principal"
                @click="leavePromptType = 'principal'"
              >
                <AddIcon decorative />
                {{ t('plugins.free-form.openid-connect.principals.guide.create') }}
              </KButton>
              <KButton
                appearance="secondary"
                data-testid="principals-learn-more"
                @click="$emit('click:learn-more', 'kong-identity')"
              >
                <BookIcon decorative />
                {{ t('plugins.free-form.openid-connect.principals.guide.learn_more') }}
              </KButton>
            </div>
          </div>
        </template>
        <slot />
      </PrincipalLookupSettings>
    </template>

    <KPrompt
      :action-button-text="t('plugins.free-form.openid-connect.principals.leave_prompt.action')"
      :message="t('plugins.free-form.openid-connect.principals.leave_prompt.message')"
      :title="t('plugins.free-form.openid-connect.principals.leave_prompt.title')"
      :visible="!!leavePromptType"
      @cancel="leavePromptType = null"
      @proceed="handleLeaveConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue'
import { KButton, KExternalLink, KInput, KPrompt, KRadio, KSelect, KSkeleton } from '@kong/kongponents'
import { AddIcon, BookIcon, CloseIcon, KeyIcon, WorldIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { AUTOFILL_SLOT, FORMS_CONFIG, type AutofillSlot } from '@kong-ui-public/forms'
import { useAxios } from '@kong-ui-public/entities-shared'
import useI18n from '../../../../composables/useI18n'
import Field from '../../shared/Field.vue'
import { useFormShared } from '../../shared/composables'
import { FORM_EDITING } from '../../shared/const'
import PrincipalLookupSettings from './PrincipalLookupSettings.vue'
import { AUTH_METHODS, KONG_IDENTITY_METHODS, isKongIdentityIssuer } from './AuthMethodsField.vue'

import type { ComputedRef } from 'vue'
import type { EntityCreateEvent, KonnectPluginFormConfig } from '../../../../types'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { OidcConfigSubset, OidcPrincipals, PrincipalsMode } from './types'

const MODE_KONG_IDENTITY = 'kong-identity'
const MODE_EXTERNAL = 'external'

const KONG_IDENTITY_SERVERS_ENDPOINT = '/v1/auth-servers/_computed'

// Kong Identity principals require Gateway 3.15+ on the data plane.
const KONG_IDENTITY_MIN_DP_VERSION = { major: 3, minor: 15 }

const isVersionBelowMinDpVersion = (version: string): boolean => {
  const [major, minor] = version.split('.').map(Number)
  if (Number.isNaN(major) || Number.isNaN(minor)) return false
  if (major !== KONG_IDENTITY_MIN_DP_VERSION.major) return major < KONG_IDENTITY_MIN_DP_VERSION.major
  return minor < KONG_IDENTITY_MIN_DP_VERSION.minor
}

interface KongIdentityServer {
  id: string
  name: string
  issuer?: string
}

interface KongIdentityClient {
  id: string
  name: string
  client_id?: string
}

const emit = defineEmits<{
  'mode-change': [mode: PrincipalsMode]
  'click:learn-more': [entity: string]
  'click:create-entity': [payload: EntityCreateEvent]
}>()

defineSlots<{
  /** Auth methods + session management, rendered at the bottom of the additional-settings collapse */
  default?: () => any
}>()

const { i18n: { t } } = useI18n()

const formsConfig = inject<KonnectPluginFormConfig | undefined>(FORMS_CONFIG)
const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)
const isEditingRef = inject<ComputedRef<boolean> | undefined>(FORM_EDITING, undefined)
const isEditing = computed(() => isEditingRef?.value ?? false)

// Read/write formData directly instead of useFormData(): the latter provides its own
// field path to descendants, which would corrupt relative path resolution for the
// `<Field name="config.issuer">` and slot content rendered below this component.
const { formData, getLabelAttributes, getEmptyOrDefault } = useFormShared<FreeFormPluginData<OidcConfigSubset>>()

const issuer = computed<string | null>({
  get: () => formData.config?.issuer ?? null,
  set: (value) => {
    if (formData.config) formData.config.issuer = value
  },
})

const clientIdValue = computed<Array<string | null> | null>({
  get: () => formData.config?.client_id ?? null,
  set: (value) => {
    if (formData.config) formData.config.client_id = value
  },
})

const clientSecretValue = computed<Array<string | null> | null>({
  get: () => formData.config?.client_secret ?? null,
  set: (value) => {
    if (formData.config) formData.config.client_secret = value
  },
})

// Decide the initial radio mode from the existing record. On edit we infer the auth source
// from the issuer; on create we default to Kong Identity and let the user toggle the radios.
const selectedMode = ref<PrincipalsMode>(
  isEditing.value
    ? (isKongIdentityIssuer(issuer.value) ? MODE_KONG_IDENTITY : MODE_EXTERNAL)
    : MODE_KONG_IDENTITY,
)

const kongIdentityServers = ref<KongIdentityServer[]>([])
const kongIdentityServersLoading = ref(false)
const clients = ref<KongIdentityClient[]>([])
const clientsLoading = ref(false)
const selectedServer = ref<KongIdentityServer | null>(null)
const leavePromptType = ref<'authServer' | 'client' | 'principal' | null>(null)
let restoringServer = false

const clientIdInfo = computed(() => getLabelAttributes('config.client_id').info)
const clientSecretInfo = computed(() => getLabelAttributes('config.client_secret').info)

const kongIdentityServerItems = computed(() =>
  kongIdentityServers.value.map(s => ({ label: s.name, value: s.id })),
)

const clientItems = computed(() =>
  clients.value.map(c => ({ label: c.name, value: c.client_id || c.id })),
)

const clientIdArray = computed<Array<string | null>>(() => {
  const ids = clientIdValue.value
  if (Array.isArray(ids) && ids.length > 0) return ids
  return [null]
})

const clientSecretArray = computed<Array<string | null>>(() => {
  const secrets = clientSecretValue.value
  if (Array.isArray(secrets) && secrets.length > 0) return secrets
  return [null]
})

const isRemoveClientDisabled = computed(() =>
  (hasAuthServersAccess.value && !selectedServer.value) || clientIdArray.value.length <= 1,
)

// Without auth-server access, the Kong Identity server/client dropdowns fall back to
// free-text inputs.
const hasAuthServersAccess = computed(() => formsConfig?.isKongIdentityAuthServersAvailable !== false)

// Separate, narrower permissions for creating (not just viewing) an auth server or a
// client under one — each hides its own "Create..." dropdown action when unavailable.
const canCreateAuthServer = computed(() => formsConfig?.canCreateAuthServer !== false)
const canCreateAuthServerClient = computed(() => formsConfig?.canCreateAuthServerClient !== false)

// True when at least one connected data plane node can't process Kong Identity
// principals (Gateway 3.15+ required). Drives a warning alert, not field hiding.
const hasIncompatibleDataPlane = computed(() =>
  (formsConfig?.dataPlaneVersions ?? []).some(isVersionBelowMinDpVersion),
)

// Whether principal lookup is on (the "Use principal lookup" opt-in toggle).
const principalsEnabled = computed(() => formData.config?.principals?.enabled === true)

// Host-precomputed: directory access → directory resolved → principals (list) access →
// principals list empty → create-principal permission. `undefined` means the host hasn't
// resolved it yet.
const principalsCreationGuideVisible = computed(() => formsConfig?.principalsCreationGuideVisible)

// Only shown once lookup is on.
const principalsGuideVisible = computed(() =>
  principalsEnabled.value && principalsCreationGuideVisible.value === true,
)

const principalsSkeletonVisible = computed(() =>
  principalsEnabled.value && principalsCreationGuideVisible.value === undefined,
)

// Immediate so it runs on mount when the host resolves principalsDirectoryName late.
// Guards on isEditing so saved edit-load values are never overwritten on mount;
// explicit mode switches are handled by handleModeChange directly.
watch(() => formsConfig?.principalsDirectoryName, (name) => {
  if (isEditing.value || selectedMode.value !== MODE_KONG_IDENTITY || name == null) return
  if (formData.config?.principals) {
    formData.config.principals.directory = name
  }
}, { immediate: true })

onMounted(() => {
  // Principal lookup is opt-in (off by default) in both modes via the "Use principal
  // lookup" toggle, so create doesn't need to force principals.enabled either way.
  if (!isEditing.value) {
    nextTick(() => {
      applyAuthMethodsForMode(selectedMode.value)
      emit('mode-change', selectedMode.value)
    })
  }
  fetchKongIdentityServers()
})

async function fetchKongIdentityServers() {
  if (formsConfig?.isKongIdentityAuthServersAvailable === false) return
  try {
    kongIdentityServersLoading.value = true
    const { axiosInstance } = useAxios(formsConfig?.axiosRequestConfig)
    const url = `${formsConfig?.apiBaseUrl}${KONG_IDENTITY_SERVERS_ENDPOINT}`
    const resp = await axiosInstance.get(url)
    kongIdentityServers.value = resp.data?.data ?? []
    // If editing with an existing issuer, try to match a server
    if (issuer.value && !selectedServer.value) {
      const matched = kongIdentityServers.value.find(s => s.issuer === issuer.value) || null
      if (matched) {
        restoringServer = true
        selectedServer.value = matched
        fetchClients(matched.id)
      }
    }
  } catch {
    kongIdentityServers.value = []
  } finally {
    kongIdentityServersLoading.value = false
  }
}

async function fetchClients(serverId: string) {
  try {
    clientsLoading.value = true
    const { axiosInstance } = useAxios(formsConfig?.axiosRequestConfig)
    const url = `${formsConfig?.apiBaseUrl}/v1/auth-servers/${serverId}/clients`
    const resp = await axiosInstance.get(url)
    clients.value = resp.data?.data ?? []
  } catch {
    clients.value = []
  } finally {
    clientsLoading.value = false
  }
}

function handleServerChange(serverId: string | null) {
  // Skip if this is the KSelect reacting to programmatic selectedServer restore
  if (restoringServer) {
    restoringServer = false
    return
  }
  // Find the selected server and prefill issuer
  selectedServer.value = kongIdentityServers.value.find(s => s.id === serverId) || null
  if (selectedServer.value?.issuer) {
    issuer.value = selectedServer.value.issuer
  }
  // Reset client selection when server changes
  clientIdValue.value = [null]
  clientSecretValue.value = [null]
  clients.value = []
  clientsLoading.value = !!serverId
  if (serverId) {
    fetchClients(serverId)
  }
}

function handleClientChange(index: number, clientId: string | null) {
  const clientIds = [...clientIdArray.value]
  clientIds[index] = clientId
  clientIdValue.value = clientIds
}

function handleClientSecretChange(index: number, value: string) {
  const secrets = [...clientSecretArray.value]
  secrets[index] = value
  clientSecretValue.value = secrets
}

function addClientRow() {
  // Base off the normalized arrays so the virtualized first row (when the
  // model is still null) is preserved instead of being dropped.
  clientIdValue.value = [...clientIdArray.value, null]
  clientSecretValue.value = [...clientSecretArray.value, null]
}

function removeClientRow(index: number) {
  if (clientIdArray.value.length <= 1) return

  const clientIds = [...clientIdArray.value]
  clientIds.splice(index, 1)
  clientIdValue.value = clientIds

  const secrets = [...clientSecretArray.value]
  secrets.splice(index, 1)
  clientSecretValue.value = secrets
}

function getClientItemsForRow(index: number) {
  const selectedIds = clientIdArray.value
  return clientItems.value.map(item => ({
    ...item,
    disabled: selectedIds.some((id, i) => i !== index && id === item.value),
  }))
}

// The `principals` record is required with defaults in the schema, so it is normally
// present on the model; fall back to schema defaults for hosts that omit it.
function currentPrincipals(): OidcPrincipals {
  return formData.config?.principals
    ?? (getEmptyOrDefault<OidcPrincipals>('config.principals') ?? {})
}

function handleUsePrincipalLookupChange(enabled: boolean) {
  // The directory/principals are already checked on mount (and cached), so toggling
  // lookup on/off just flips the flag — no extra network request.
  if (formData.config) {
    formData.config.principals = { ...currentPrincipals(), enabled }
  }
}

function handleLeaveConfirmed() {
  const type = leavePromptType.value
  leavePromptType.value = null
  // The consuming app owns navigation to the create pages; we only confirm intent
  // (unsaved-changes prompt) and emit. Client creation needs the auth server context.
  if (type === 'authServer') {
    emit('click:create-entity', { type: 'auth-server' })
  } else if (type === 'client') {
    emit('click:create-entity', { type: 'client', authServerId: selectedServer.value?.id })
  } else if (type === 'principal') {
    emit('click:create-entity', { type: 'principal' })
  }
}

// Auto-select the auth methods that match the mode: Kong Identity restricts to its four
// supported methods; External selects everything. Session stays in `auth_methods` but is
// presented separately, so preserve it on edit and default it on create/switch.
function applyAuthMethodsForMode(mode: PrincipalsMode) {
  const currentSession = (formData.config?.auth_methods ?? []).includes('session')
  const session = mode === MODE_EXTERNAL || !isEditing.value ? true : currentSession
  const methods = mode === MODE_KONG_IDENTITY ? [...KONG_IDENTITY_METHODS] : [...AUTH_METHODS]
  if (session) {
    methods.push('session')
  }
  if (formData.config) {
    formData.config.auth_methods = methods
  }
}

function handleModeChange(newMode: PrincipalsMode) {
  // Clear the mode-specific credential fields either way
  if (formData.config) {
    formData.config.client_id = null
    formData.config.client_secret = null
    formData.config.issuer = null
  }

  // Principal lookup is opt-in (the "Use principal lookup" toggle) in both modes, so it
  // starts off; other principals defaults are restored regardless.
  if (formData.config) {
    const principals = currentPrincipals()
    // Kong Identity adopts the host-resolved directory name; External stays 'default'
    // until the user opts in.
    const dir = newMode === MODE_KONG_IDENTITY
      ? formsConfig?.principalsDirectoryName ?? principals.directory
      : 'default'

    formData.config.principals = {
      ...principals,
      enabled: false,
      error_on_miss: true,
      match_consumer: true,
      match_consumer_groups: true,
      directory: dir,
    }
  }

  if (newMode === MODE_EXTERNAL) {
    // Reset local state
    selectedServer.value = null
    clients.value = []
  }

  applyAuthMethodsForMode(newMode)
  emit('mode-change', newMode)
}
</script>

<style lang="scss" scoped>
.oidc-principals-section {
  display: flex;
  flex-direction: column;
}

.principals-header {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  line-height: var(--kui-line-height-40, $kui-line-height-40);
  margin-bottom: var(--kui-space-40, $kui-space-40);
}

.principals-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  margin-bottom: var(--kui-space-50, $kui-space-50);

  // inline-flex keeps the "Learn more" text and its external-link icon on the same line
  // (so the icon wraps together with the text instead of dropping to its own line).
  a {
    align-items: center;
    display: inline-flex;
  }
}

.principals-create-guide {
  align-items: center;
  background-color: var(--kui-color-background-decorative-purple-weakest, $kui-color-background-decorative-purple-weakest);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
  margin-bottom: var(--kui-space-60, $kui-space-60);
  padding: var(--kui-space-80, $kui-space-80);
  text-align: center;
}

.principals-create-guide-title {
  color: var(--kui-color-text, $kui-color-text);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

.principals-create-guide-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  max-width: 640px;
}

.principals-create-guide-actions {
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  margin-top: var(--kui-space-20, $kui-space-20);
}

.oidc-auth-mode-radio-group {
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-40, $kui-space-40);
  margin-bottom: var(--kui-space-60, $kui-space-60);
}

.create-action {
  align-items: flex-start;
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  cursor: pointer;
  display: flex;
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  gap: var(--kui-space-20, $kui-space-20);

  .create-action-hint {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    margin-top: var(--kui-space-20, $kui-space-20);
  }
}

.client-row {
  align-items: flex-start;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  margin-top: var(--kui-space-40, $kui-space-40);

  .principals-client-select {
    flex: 1;
    margin-top: 0;
  }

  .principals-client-secret-wrapper {
    flex: 1;
  }

  .principals-client-secret {
    width: 100%;
  }
}

.remove-client-btn {
  align-items: center;
  background: none;
  border: none;
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  margin-top: var(--kui-space-30, $kui-space-30);
  padding: var(--kui-space-20, $kui-space-20);

  &:hover {
    color: var(--kui-color-text-danger, $kui-color-text-danger);
  }

  &:disabled,
  &:disabled:hover {
    color: var(--kui-color-text-disabled, $kui-color-text-disabled);
    cursor: not-allowed;
  }
}

.client-row-with-label .remove-client-btn {
  margin-top: 60px;
}

.add-client-inline {
  align-items: center;
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  cursor: pointer;
  display: flex;
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  gap: var(--kui-space-20, $kui-space-20);
  margin: var(--kui-space-40, $kui-space-40) 0;
}

.add-client-inline-disabled {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  cursor: default;
  pointer-events: none;
}

// External auth server mode: client_id + client_secret share a row.
.external-client-field {
  flex: 1;
  min-width: 0;

  .external-client-input {
    width: 100%;
  }

  // Schema help text renders as sanitized HTML (see #label-tooltip above) and is commonly
  // wrapped in a <p>; reset its default browser margin so it doesn't show as blank space
  // above/below the tooltip text.
  :deep(.k-tooltip p) {
    margin: 0;
  }
}

.principals-directory-select,
.principals-client-select {
  :deep(.dropdown-footer.dropdown-footer-sticky) {
    pointer-events: auto;
  }
}

.auth-mode-card-content {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-20, $kui-space-20);
  text-align: left;

  .auth-mode-card-label {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  .auth-mode-card-description {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  }
}

.oidc-auth-mode-radio-group :deep(.k-radio.radio-card.checked.card-horizontal) {
  .auth-mode-card-label {
    color: var(--kui-color-text-primary, $kui-color-text-primary);
  }
}
</style>

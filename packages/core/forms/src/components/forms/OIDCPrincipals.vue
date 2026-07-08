<template>
  <div
    class="oidc-principals-section"
    data-testid="oidc-principals-section"
  >
    <div class="principals-header">
      Who should manage authentication and credentials?
    </div>
    <div class="principals-description">
      Use External auth server to continue using your existing OAuth provider and authentication workflows. Use Kong Identity to adopt a newer principal-based model that centralizes and simplifies identity and authentication management.
      <KExternalLink href="https://developer.konghq.com/plugins/openid-connect/">
        Learn more.
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
            Kong Identity
          </div>
          <div class="auth-mode-card-description">
            Use Kong Identity to authenticate OpenID Connect tokens. If all data plane nodes are running version 3.15 or later, you can also map requests to Kong Identity principals for advanced policies and integrations.
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
            External auth server
          </div>
          <div class="auth-mode-card-description">
            Connect to your existing identity provider to manage authentication outside of Kong.
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
        Add principals
      </div>
      <div class="principals-create-guide-description">
        Get more value from OAuth 2.0 integration by creating principals in Kong Identity. Associate principals with this authorization server and its clients to enable principal-based authentication across Kong products.
      </div>
      <div class="principals-create-guide-actions">
        <KButton
          appearance="primary"
          data-testid="principals-create-principal"
          @click="leavePromptType = 'principal'"
        >
          <AddIcon decorative />
          Create principal
        </KButton>
        <KButton
          appearance="secondary"
          data-testid="principals-learn-more"
          @click="$emit('click:learn-more', 'kong-identity')"
        >
          <BookIcon decorative />
          Learn more
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
        label="Authorization Server"
        :label-attributes="{
          info: 'The Kong Identity auth server that will act as the OpenID Connect provider for this plugin.',
          tooltipAttributes: { maxWidth: '300' },
        }"
        :loading="kongIdentityServersLoading"
        :model-value="selectedServer?.id"
        placeholder="Select an Authorization Server"
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
              <span>Create authorization server</span>
              <div class="create-action-hint">
                You'll need to return here after creating an authorization server. Your progress won't be saved.
              </div>
            </div>
          </div>
        </template>
      </KSelect>
      <KInput
        v-else
        data-testid="kong-identity-issuer-input"
        help="You don't have access to browse authorization servers. Enter the issuer URL of your Kong Identity authorization server directly."
        label="Authorization Server"
        :label-attributes="{
          info: 'The Kong Identity auth server that will act as the OpenID Connect provider for this plugin.',
          tooltipAttributes: { maxWidth: '300' },
        }"
        :model-value="formModel['config-issuer']"
        placeholder="e.g., https://your-auth-server.identity.konghq.com"
        required
        @update:model-value="updateField('config-issuer', $event)"
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
          :label="index === 0 ? 'Client' : undefined"
          :model-value="clientId"
          placeholder="e.g., kong-gateway-client"
          @update:model-value="handleClientChange(index, $event)"
        />
        <KSelect
          v-else
          class="principals-client-select"
          data-testid="principals-client-select"
          :disabled="!selectedServer"
          enable-filtering
          :items="getClientItemsForRow(index)"
          :label="index === 0 ? 'Client' : undefined"
          :loading="clientsLoading"
          :model-value="clientId"
          placeholder="Select a client"
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
                <span>Create client</span>
                <div class="create-action-hint">
                  You'll need to return here after creating a client. Your progress won't be saved.
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
            :label="index === 0 ? 'Client secret' : undefined"
            :model-value="clientSecretArray[index]"
            placeholder="e.g., your-client-secret"
            show-password-mask-toggle
            type="password"
            @update:model-value="handleClientSecretChange(index, $event)"
          />
          <component
            :is="autofillSlot"
            v-if="autofillSlot"
            :schema="{ model: 'config-client_secret', referenceable: true }"
            :update="(val) => handleClientSecretChange(index, val)"
            :value="clientSecretArray[index]"
          />
        </div>
        <button
          aria-label="Remove client"
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
        + Add client
      </div>

      <!-- Principal lookup is opt-in (off by default) in Kong Identity mode too: the
           in-collapse toggle enables it, then it runs after token verification. The
           principals-specific content requires directories access; the sibling
           advanced-fields slot (OIDC auth methods) always renders regardless. -->
      <PrincipalLookupSettings
        :data-plane-incompatible="hasIncompatibleDataPlane"
        :form-model="formModel"
        :on-enabled-change="handleUsePrincipalLookupChange"
        :on-model-updated="onModelUpdated"
        show-enable-toggle
      >
        <slot name="advanced-fields" />
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
            :label="index === 0 ? 'Client id' : undefined"
            :label-attributes="{
              info: !formOptions?.helpAsHtml ? externalClientIdField?.help : undefined,
              tooltipAttributes: { maxWidth: '300' },
            }"
            :model-value="clientIdArray[index]"
            placeholder="e.g., kong-gateway-client"
            @update:model-value="handleClientChange(index, $event)"
          >
            <!-- Mirrors FormGroup.vue's helpAsHtml handling: schema help text is raw HTML
                 (e.g. wrapped in <p>), sanitized and rendered here instead of via
                 labelAttributes.info (which VFG only treats as plain text). -->
            <template
              v-if="formOptions?.helpAsHtml && externalClientIdField?.help"
              #label-tooltip
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="sanitize(externalClientIdField.help)" />
            </template>
          </KInput>
          <component
            :is="autofillSlot"
            v-if="autofillSlot"
            :schema="{ model: 'config-client_id', referenceable: true }"
            :update="(val) => handleClientChange(index, val)"
            :value="clientIdArray[index]"
          />
        </div>
        <div class="external-client-field">
          <KInput
            class="external-client-input"
            data-testid="external-client-secret"
            :label="index === 0 ? 'Client secret' : undefined"
            :label-attributes="{
              info: !formOptions?.helpAsHtml ? externalClientSecretField?.help : undefined,
              tooltipAttributes: { maxWidth: '300' },
            }"
            :model-value="clientSecretArray[index]"
            placeholder="e.g., your-client-secret"
            show-password-mask-toggle
            type="password"
            @update:model-value="handleClientSecretChange(index, $event)"
          >
            <template
              v-if="formOptions?.helpAsHtml && externalClientSecretField?.help"
              #label-tooltip
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="sanitize(externalClientSecretField.help)" />
            </template>
          </KInput>
          <component
            :is="autofillSlot"
            v-if="autofillSlot"
            :schema="{ model: 'config-client_secret', referenceable: true }"
            :update="(val) => handleClientSecretChange(index, val)"
            :value="clientSecretArray[index]"
          />
        </div>
        <button
          aria-label="Remove client"
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
        + Add client
      </div>

      <VueFormGenerator
        :model="formModel"
        :options="formOptions"
        :schema="issuerFieldsSchema"
        @model-updated="onModelUpdated"
      />

      <!-- Principals-specific content requires directories access; the sibling
           advanced-fields slot (OIDC auth methods) always renders regardless. -->
      <PrincipalLookupSettings
        :data-plane-incompatible="hasIncompatibleDataPlane"
        :form-model="formModel"
        :on-enabled-change="handleUsePrincipalLookupChange"
        :on-model-updated="onModelUpdated"
        show-enable-toggle
      >
        <!-- No directory / no principals: guide the user to set up Kong Identity, inside the
             additional settings (the toggle above is disabled in this state). -->
        <template #banner>
          <KSkeleton
            v-if="isKonnect && formsConfig?.principalsCreationGuideVisible === undefined"
            class="principals-create-guide-skeleton"
            data-testid="principals-create-guide-loading"
          />
          <div
            v-else-if="isKonnect && formsConfig?.principalsCreationGuideVisible"
            class="principals-create-guide"
            data-testid="principals-create-guide"
          >
            <div class="principals-create-guide-title">
              Add principals
            </div>
            <div class="principals-create-guide-description">
              Get more value from OAuth 2.0 integration by creating principals in Kong Identity. Associate principals with this authorization server and its clients to enable principal-based authentication across Kong products. Requires data plane nodes to be running version 3.15 or later.
            </div>
            <div class="principals-create-guide-actions">
              <KButton
                appearance="primary"
                data-testid="principals-create-principal"
                @click="leavePromptType = 'principal'"
              >
                <AddIcon decorative />
                Create principal
              </KButton>
              <KButton
                appearance="secondary"
                data-testid="principals-learn-more"
                @click="$emit('click:learn-more', 'kong-identity')"
              >
                <BookIcon decorative />
                Learn more
              </KButton>
            </div>
          </div>
        </template>
        <slot name="advanced-fields" />
      </PrincipalLookupSettings>
    </template>

    <KPrompt
      action-button-text="Leave page"
      message="Your unsaved changes will be lost if you continue."
      title="Leave this page?"
      :visible="!!leavePromptType"
      @cancel="leavePromptType = null"
      @proceed="handleLeaveConfirmed"
    />
  </div>
</template>

<script>
import DOMPurify from 'dompurify'
import VueFormGenerator from '../FormGenerator.vue'
import PrincipalLookupSettings from './PrincipalLookupSettings.vue'
import { FORMS_CONFIG, AUTOFILL_SLOT } from '../../const'
import { useAxios } from '@kong-ui-public/entities-shared'
import { AddIcon, BookIcon, CloseIcon, KeyIcon, WorldIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30, KUI_ICON_SIZE_40 } from '@kong/design-tokens'

const MODE_KONG_IDENTITY = 'kong-identity'
const MODE_EXTERNAL = 'external'

// TODO: Replace with the actual endpoint once the API is ready
const KONG_IDENTITY_SERVERS_ENDPOINT = '/v1/auth-servers/_computed'

// Kong Identity auth servers are hosted under the identity.konghq domain; an issuer that
// does not match is an external IdP.
const KONG_IDENTITY_ISSUER_MARKER = 'identity.konghq'

const isKongIdentityIssuer = (issuer) =>
  typeof issuer === 'string' && issuer.includes(KONG_IDENTITY_ISSUER_MARKER)

// Kong Identity principals require Gateway 3.15+ on the data plane.
const KONG_IDENTITY_MIN_DP_VERSION = { major: 3, minor: 15 }

const isVersionBelowMinDpVersion = (version) => {
  const [major, minor] = version.split('.').map(Number)
  if (Number.isNaN(major) || Number.isNaN(minor)) return false
  if (major !== KONG_IDENTITY_MIN_DP_VERSION.major) return major < KONG_IDENTITY_MIN_DP_VERSION.major
  return minor < KONG_IDENTITY_MIN_DP_VERSION.minor
}

// Decide the initial radio mode from the existing record. On edit we infer the auth source
// from the issuer; on create we default to Kong Identity and let the user toggle the radios.
const inferInitialMode = (formModel, isEditing) => {
  if (!isEditing) return MODE_KONG_IDENTITY
  return isKongIdentityIssuer(formModel['config-issuer']) ? MODE_KONG_IDENTITY : MODE_EXTERNAL
}

export default {
  name: 'OIDCPrincipals',
  components: { VueFormGenerator, PrincipalLookupSettings, AddIcon, BookIcon, CloseIcon, KeyIcon, WorldIcon },
  inject: {
    formsConfig: {
      from: FORMS_CONFIG,
      default: () => ({}),
    },
    autofillSlot: {
      from: AUTOFILL_SLOT,
      default: undefined,
    },
  },
  props: {
    formModel: {
      type: Object,
      required: true,
    },
    formSchema: {
      type: Object,
      required: true,
    },
    formOptions: {
      type: Object,
      default: () => ({}),
    },
    commonFieldsSchema: {
      type: Object,
      required: true,
    },
    onModelUpdated: {
      type: Function,
      required: true,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['mode-change', 'click:learn-more', 'click:create-entity'],
  data() {
    const initialMode = inferInitialMode(this.formModel, this.isEditing)
    return {
      MODE_KONG_IDENTITY,
      MODE_EXTERNAL,
      KUI_ICON_SIZE_20,
      KUI_ICON_SIZE_30,
      KUI_ICON_SIZE_40,
      selectedMode: initialMode,
      kongIdentityServers: [],
      kongIdentityServersLoading: false,
      clients: [],
      clientsLoading: false,
      selectedServer: null,
      restoringServer: false,
      leavePromptType: null,
    }
  },
  computed: {
    // External-mode schema for the issuer field only — client_id/client_secret
    // are rendered as paired rows below, so VFG only handles issuer here.
    issuerFieldsSchema() {
      const fields = (this.commonFieldsSchema?.fields ?? []).filter(f => f.model === 'config-issuer')
      return { ...this.commonFieldsSchema, fields }
    },
    externalClientIdField() {
      return (this.commonFieldsSchema?.fields ?? []).find(f => f.model === 'config-client_id')
    },
    externalClientSecretField() {
      return (this.commonFieldsSchema?.fields ?? []).find(f => f.model === 'config-client_secret')
    },
    kongIdentityServerItems() {
      return this.kongIdentityServers.map(s => ({ label: s.name, value: s.id }))
    },
    clientItems() {
      return this.clients.map(c => ({ label: c.name, value: c.client_id || c.id }))
    },
    clientIdArray() {
      const ids = this.formModel['config-client_id']
      if (Array.isArray(ids) && ids.length > 0) return ids
      return [null]
    },
    clientSecretArray() {
      const secrets = this.formModel['config-client_secret']
      if (Array.isArray(secrets) && secrets.length > 0) return secrets
      return [null]
    },
    isRemoveClientDisabled() {
      return (this.hasAuthServersAccess && !this.selectedServer) || this.clientIdArray.length <= 1
    },
    // Kong Identity directories/principals are a Konnect-only concept.
    isKonnect() {
      return this.formsConfig?.app === 'konnect'
    },
    // Without auth-server access, Kong Identity mode isn't offered at all.
    hasAuthServersAccess() {
      return this.formsConfig?.isKongIdentityAuthServersAvailable !== false
    },
    // Separate, narrower permissions for creating (not just viewing) an auth server or a
    // client under one — each hides its own "Create..." dropdown action when unavailable.
    canCreateAuthServer() {
      return this.formsConfig?.canCreateAuthServer !== false
    },
    canCreateAuthServerClient() {
      return this.formsConfig?.canCreateAuthServerClient !== false
    },
    // True when at least one connected data plane node can't process Kong Identity
    // principals (Gateway 3.15+ required). Drives a warning alert, not field hiding.
    hasIncompatibleDataPlane() {
      return (this.formsConfig?.dataPlaneVersions ?? []).some(isVersionBelowMinDpVersion)
    },
    // Whether principal lookup is on. Kong Identity mode pins this true; External mode
    // controls it with the "Use principal lookup" toggle (config-principals-enabled).
    principalsEnabled() {
      return this.formModel['config-principals-enabled'] === true
    },
    // Host-precomputed: directory access → directory resolved → principals (list) access →
    // principals list empty → create-principal permission. Only shown once lookup is on.
    principalsGuideVisible() {
      return this.isKonnect && this.principalsEnabled && this.formsConfig?.principalsCreationGuideVisible === true
    },
    // `undefined` means the host hasn't resolved principalsCreationGuideVisible yet.
    principalsSkeletonVisible() {
      return this.isKonnect && this.principalsEnabled && this.formsConfig?.principalsCreationGuideVisible === undefined
    },
  },
  watch: {
    // Immediate so it runs on mount when the host resolves principalsDirectoryName late.
    // Guards on isEditing so saved edit-load values are never overwritten on mount;
    // explicit mode switches are handled by handleModeChange directly.
    'formsConfig.principalsDirectoryName': {
      immediate: true,
      handler(name) {
        if (this.isEditing || this.selectedMode !== MODE_KONG_IDENTITY || name == null) return
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-directory'] = name
        this.onModelUpdated()
      },
    },
  },
  mounted() {
    // Principal lookup is opt-in (off by default) in both modes via the "Use principal
    // lookup" toggle, so create doesn't need to force config-principals-enabled either way.
    if (!this.isEditing) {
      this.$nextTick(() => this.$emit('mode-change', this.selectedMode))
    }
    this.fetchKongIdentityServers()
  },
  methods: {
    async fetchKongIdentityServers() {
      if (this.formsConfig?.isKongIdentityAuthServersAvailable === false) return
      try {
        this.kongIdentityServersLoading = true
        const { axiosInstance } = useAxios(this.formsConfig?.axiosRequestConfig)
        const url = `${this.formsConfig.apiBaseUrl}${KONG_IDENTITY_SERVERS_ENDPOINT}`
        const resp = await axiosInstance.get(url)
        this.kongIdentityServers = resp.data?.data ?? []
        // If editing with an existing issuer, try to match a server
        const issuer = this.formModel['config-issuer']
        if (issuer && !this.selectedServer) {
          const matched = this.kongIdentityServers.find(s => s.issuer === issuer) || null
          if (matched) {
            this.restoringServer = true
            this.selectedServer = matched
            this.fetchClients(matched.id)
          }
        }
      } catch {
        this.kongIdentityServers = []
      } finally {
        this.kongIdentityServersLoading = false
      }
    },
    async fetchClients(serverId) {
      try {
        this.clientsLoading = true
        const { axiosInstance } = useAxios(this.formsConfig?.axiosRequestConfig)
        const url = `${this.formsConfig.apiBaseUrl}/v1/auth-servers/${serverId}/clients`
        const resp = await axiosInstance.get(url)
        this.clients = resp.data?.data ?? []
      } catch {
        this.clients = []
      } finally {
        this.clientsLoading = false
      }
    },
    handleServerChange(serverId) {
      // Skip if this is the KSelect reacting to programmatic selectedServer restore
      if (this.restoringServer) {
        this.restoringServer = false
        return
      }
      // Find the selected server and prefill issuer
      this.selectedServer = this.kongIdentityServers.find(s => s.id === serverId) || null
      if (this.selectedServer?.issuer) {
        this.updateField('config-issuer', this.selectedServer.issuer)
      }
      // Reset client selection when server changes
      this.updateField('config-client_id', [null])
      this.updateField('config-client_secret', [null])
      this.clients = []
      this.clientsLoading = !!serverId
      if (serverId) {
        this.fetchClients(serverId)
      }
    },
    handleClientChange(index, clientId) {
      const clientIds = Array.isArray(this.formModel['config-client_id'])
        ? [...this.formModel['config-client_id']]
        : []
      clientIds[index] = clientId
      this.updateField('config-client_id', clientIds)
    },
    addClientRow() {
      // Base off the normalized arrays so the virtualized first row (when the
      // model is still null) is preserved instead of being dropped.
      const clientIds = [...this.clientIdArray]
      clientIds.push(null)
      this.updateField('config-client_id', clientIds)

      const secrets = [...this.clientSecretArray]
      secrets.push(null)
      this.updateField('config-client_secret', secrets)
    },
    removeClientRow(index) {
      if (this.clientIdArray.length <= 1) return

      const clientIds = [...this.clientIdArray]
      clientIds.splice(index, 1)
      this.updateField('config-client_id', clientIds)

      const secrets = [...this.clientSecretArray]
      secrets.splice(index, 1)
      this.updateField('config-client_secret', secrets)
    },
    handleClientSecretChange(index, value) {
      const secrets = Array.isArray(this.formModel['config-client_secret'])
        ? [...this.formModel['config-client_secret']]
        : []
      secrets[index] = value
      this.updateField('config-client_secret', secrets)
    },
    getClientItemsForRow(index) {
      const selectedIds = this.clientIdArray
      return this.clientItems.map(item => ({
        ...item,
        disabled: selectedIds.some((id, i) => i !== index && id === item.value),
      }))
    },
    updateField(field, value) {
      // eslint-disable-next-line vue/no-mutating-props
      this.formModel[field] = value
      this.onModelUpdated()
    },
    // Mirrors FormGroup.vue's sanitize() — used to render schema help text (raw HTML) via
    // v-html when formOptions.helpAsHtml is set.
    sanitize(str) {
      return DOMPurify.sanitize(str)
    },
    handleUsePrincipalLookupChange(enabled) {
      // The directory/principals are already checked on mount (and cached), so toggling
      // lookup on/off just flips the flag — no extra network request.
      this.updateField('config-principals-enabled', enabled)
    },
    handleLeaveConfirmed() {
      const type = this.leavePromptType
      this.leavePromptType = null
      // The consuming app owns navigation to the create pages; we only confirm intent
      // (unsaved-changes prompt) and emit. Client creation needs the auth server context.
      if (type === 'authServer') {
        this.$emit('click:create-entity', { type: 'auth-server' })
      } else if (type === 'client') {
        this.$emit('click:create-entity', { type: 'client', authServerId: this.selectedServer?.id })
      } else if (type === 'principal') {
        this.$emit('click:create-entity', { type: 'principal' })
      }
    },
    handleModeChange(newMode) {
      if (newMode === MODE_KONG_IDENTITY) {
        // Clear external-mode fields
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-client_id'] = null
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-client_secret'] = null
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-issuer'] = null
        // Kong Identity mode: principal lookup is opt-in (the "Use principal lookup"
        // toggle), so it starts off; other principals defaults are restored regardless.
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-enabled'] = false
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-error_on_miss'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-match_consumer'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-match_consumer_groups'] = true
        // Adopt the host-resolved directory name when explicitly switching into Kong Identity.
        const dir = this.formsConfig?.principalsDirectoryName
        // eslint-disable-next-line vue/no-mutating-props
        if (dir != null) this.formModel['config-principals-directory'] = dir

      } else {
        // External auth server: principal lookup is opt-in (the "Use principal lookup"
        // toggle), so it starts off; the directory stays 'default' until the user opts in.
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-enabled'] = false
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-directory'] = 'default'
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-error_on_miss'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-match_consumer'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-match_consumer_groups'] = true
        // Clear client fields
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-client_id'] = null
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-client_secret'] = null
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-issuer'] = null
        // Reset local state
        this.selectedServer = null
        this.clients = []
      }
      this.onModelUpdated()
      this.$emit('mode-change', newMode)
    },
  },
}
</script>

<style lang="scss" scoped>
.oidc-principals-section {
  margin-top: var(--kui-space-60, $kui-space-60);
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

.principals-advanced-settings {
  margin-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-hidden-content) {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
  }

  :deep(.k-label) {
    margin-top: var(--kui-space-0, $kui-space-0);
  }
}

.oidc-auth-mode-radio-group {
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-40, $kui-space-40);
  margin-bottom: var(--kui-space-60, $kui-space-60);
}

.principals-field-group {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}

.lookup-method-item {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-10, $kui-space-10);
}

.lookup-method-item-label {
  color: var(--kui-color-text, $kui-color-text);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

.lookup-method-item-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
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

.create-action-disabled {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  cursor: default;
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

  &:disabled {
    color: var(--kui-color-text-disabled, $kui-color-text-disabled);
    cursor: not-allowed;
  }

  &:disabled:hover {
    color: var(--kui-color-text-disabled, $kui-color-text-disabled);
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
  margin-top: var(--kui-space-40, $kui-space-40);
}

.add-client-inline-disabled {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  cursor: default;
  pointer-events: none;
}

:deep(.create-action) {
  cursor: pointer;
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
  // above/below the tooltip text. Matches FormGroup.vue's ":deep(.k-tooltip p) { margin: 0; }".
  :deep(.k-tooltip p) {
    margin: 0;
  }
}

.principals-directory-select {
  :deep(.dropdown-footer.dropdown-footer-sticky) {
    pointer-events: auto;
  }
}

.principals-client-select {
  margin-top: var(--kui-space-40, $kui-space-40);

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

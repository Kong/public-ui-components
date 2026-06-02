<template>
  <div
    class="oidc-principals-section"
    data-testid="oidc-principals-section"
  >
    <div class="principals-header">
      Who should manage authentication and credentials?
    </div>
    <div class="principals-description">
      Use Consumers for Consumer-based authentication. Use Kong Identity for principal-based authentication and advanced integrations.
      <a
        href="https://developer.konghq.com/plugins/openid-connect/"
        rel="noopener noreferrer"
        target="_blank"
      >Learn more.</a>
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
          <KeyIcon :size="KUI_ICON_SIZE_40" />
          <div class="auth-mode-card-label">
            Kong Identity
          </div>
          <div class="auth-mode-card-description">
            Use Kong Identity for principal-based authentication and advanced integrations.
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
          <WorldIcon :size="KUI_ICON_SIZE_40" />
          <div class="auth-mode-card-label">
            External auth server
          </div>
          <div class="auth-mode-card-description">
            Authenticate against an external OpenID Connect issuer.
          </div>
        </div>
      </KRadio>
    </div>

    <template v-if="selectedMode === MODE_KONG_IDENTITY">
      <KSelect
        class="principals-directory-select"
        data-testid="principals-directory-select"
        :items="kongIdentityServerItems"
        label="Authorization Server"
        :loading="kongIdentityServersLoading"
        :model-value="selectedServer?.id"
        placeholder="Select an Authorization Server"
        required
        @update:model-value="handleServerChange"
      >
        <template #dropdown-footer-text>
          <div
            class="create-action"
            data-testid="create-auth-server-action"
            @click.stop="leavePromptType = 'authServer'"
          >
            <AddIcon :size="KUI_ICON_SIZE_20" />
            <div class="create-action-content">
              <span>Create authorization server</span>
              <div class="create-action-hint">
                You’ll need to return here after creating a auth server. Your progress won’t be saved.
              </div>
            </div>
          </div>
        </template>
      </KSelect>

      <KSelect
        class="principals-client-select"
        data-testid="principals-client-select"
        :disabled="!selectedServer"
        :items="clientItems"
        label="Client"
        :loading="clientsLoading"
        :model-value="selectedClientId"
        placeholder="Select a client"
        @update:model-value="handleClientChange"
      >
        <template #dropdown-footer-text>
          <div
            class="create-action"
            data-testid="create-client-action"
            @click.stop="leavePromptType = 'client'"
          >
            <AddIcon :size="KUI_ICON_SIZE_20" />
            <div class="create-action-content">
              <span>Create client</span>
              <div class="create-action-hint">
                You'll need to return here after creating a client. Your progress won't be saved.
              </div>
            </div>
          </div>
        </template>
      </KSelect>

      <KInput
        data-testid="principals-client-secret"
        :disabled="!selectedServer"
        label="Client secret"
        :model-value="formModel['config-client_secret']"
        placeholder="e.g., your-client-secret"
        type="password"
        @update:model-value="updateField('config-client_secret', $event)"
      />

      <KInput
        data-testid="principals-issuer"
        disabled
        label="Issuer"
        :model-value="formModel['config-issuer']"
        placeholder="Automatically deciphered based on the selected auth server"
      />

      <KCollapse
        class="principals-advanced-settings"
        data-testid="principals-advanced-settings"
        trigger-label="Show additional settings"
      >
        <div class="principals-field-group">
          <KLabel>If principal lookup fails</KLabel>
          <KRadio
            data-testid="principals-error-on-miss-true"
            description="Treat the request as unauthenticated if Kong Identity cannot resolve the principal."
            label="Reject the request"
            :model-value="formModel['config-principals-error_on_miss']"
            :selected-value="true"
            @change="updateField('config-principals-error_on_miss', true)"
          />
          <KRadio
            data-testid="principals-error-on-miss-false"
            description="Allow the request to continue without resolving a principal."
            label="Continue without a principal"
            :model-value="formModel['config-principals-error_on_miss']"
            :selected-value="false"
            @change="updateField('config-principals-error_on_miss', false)"
          />
        </div>

        <div class="principals-field-group">
          <KCheckbox
            data-testid="principals-match-consumer"
            :model-value="formModel['config-principals-match_consumer']"
            @update:model-value="handleMatchConsumerChange($event)"
          >
            Use linked consumers
            <template #description>
              Use the consumer linked to the authenticated principal so existing consumer-based plugins and policies continue to work.
              <a
                href="https://developer.konghq.com/how-to/create-centrally-managed-consumer/"
                rel="noopener noreferrer"
                target="_blank"
              >Learn how to link a consumer.</a>
            </template>
          </KCheckbox>
        </div>

        <div class="principals-field-group">
          <KCheckbox
            data-testid="principals-match-consumer-groups"
            :disabled="!formModel['config-principals-match_consumer']"
            :model-value="formModel['config-principals-match_consumer_groups']"
            @update:model-value="updateField('config-principals-match_consumer_groups', $event)"
          >
            Use linked consumer groups
            <template #description>
              Use consumer groups associated with the linked consumer so existing consumer group policies and plugins continue to work. This setting applies only when  <b>Use linked consumer</b> is enabled.
            </template>
          </KCheckbox>
        </div>
      </KCollapse>
    </template>

    <VueFormGenerator
      v-else
      :model="formModel"
      :options="formOptions"
      :schema="commonFieldsSchema"
      @model-updated="onModelUpdated"
    />

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
import VueFormGenerator from '../FormGenerator.vue'
import { FORMS_CONFIG } from '../../const'
import { useAxios } from '@kong-ui-public/entities-shared'
import { AddIcon, KeyIcon, WorldIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_40 } from '@kong/design-tokens'

const MODE_KONG_IDENTITY = 'kong-identity'
const MODE_EXTERNAL = 'external'

// TODO: Replace with the actual endpoint once the API is ready
const KONG_IDENTITY_SERVERS_ENDPOINT = '/v1/auth-servers/_computed'

const PRINCIPALS_FIELD_MODELS = new Set([
  'config-principals-enabled',
  'config-principals-directory',
  'config-principals-principal_by',
  'config-principals-principal_claim',
  'config-principals-match_consumer',
  'config-principals-match_consumer_groups',
  'config-principals-error_on_miss',
])

// External-auth-server (commonFields) field models — kept in sync with OIDCForm.
const COMMON_FIELD_MODELS = new Set([
  'config-client_id',
  'config-client_secret',
  'config-issuer',
])

// Decide the initial radio mode from the existing record.
const inferInitialMode = (formModel) => {
  if (formModel['config-principals-enabled'] === true) return MODE_KONG_IDENTITY
  for (const key of COMMON_FIELD_MODELS) {
    const v = formModel[key]
    if (v !== undefined && v !== null && v !== '') return MODE_EXTERNAL
  }
  return MODE_KONG_IDENTITY
}

export default {
  name: 'OIDCPrincipals',
  components: { VueFormGenerator, AddIcon, KeyIcon, WorldIcon },
  inject: {
    formsConfig: {
      from: FORMS_CONFIG,
      default: () => ({}),
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
  },
  data() {
    return {
      MODE_KONG_IDENTITY,
      MODE_EXTERNAL,
      KUI_ICON_SIZE_20,
      KUI_ICON_SIZE_40,
      selectedMode: inferInitialMode(this.formModel),
      kongIdentityServers: [],
      kongIdentityServersLoading: false,
      clients: [],
      clientsLoading: false,
      selectedClientId: null,
      selectedServer: null,
      leavePromptType: null,
    }
  },
  computed: {
    kongIdentityServerItems() {
      return this.kongIdentityServers.map(s => ({ label: s.name, value: s.id }))
    },
    clientItems() {
      return this.clients.map(c => ({ label: c.name, value: c.client_id || c.id }))
    },
  },
  mounted() {
    this.fetchKongIdentityServers()
    // Pre-select the first client_id if it exists (for edit mode)
    const clientIds = this.formModel['config-client_id']
    if (Array.isArray(clientIds) && clientIds.length > 0) {
      this.selectedClientId = clientIds[0]
    }
  },
  methods: {
    async fetchKongIdentityServers() {
      try {
        this.kongIdentityServersLoading = true
        const { axiosInstance } = useAxios(this.formsConfig?.axiosRequestConfig)
        const url = `${this.formsConfig.apiBaseUrl}${KONG_IDENTITY_SERVERS_ENDPOINT}`
        const resp = await axiosInstance.get(url)
        this.kongIdentityServers = resp.data?.data ?? []
        // If editing with an existing issuer, try to match a server
        const issuer = this.formModel['config-issuer']
        if (issuer && !this.selectedServer) {
          this.selectedServer = this.kongIdentityServers.find(s => s.issuer === issuer) || null
          if (this.selectedServer) {
            this.fetchClients(this.selectedServer.id)
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
      // Find the selected server and prefill issuer
      this.selectedServer = this.kongIdentityServers.find(s => s.id === serverId) || null
      if (this.selectedServer?.issuer) {
        this.updateField('config-issuer', this.selectedServer.issuer)
      }
      // Reset client selection when server changes
      this.selectedClientId = null
      this.clients = []
      this.clientsLoading = !!serverId
      if (serverId) {
        this.fetchClients(serverId)
      }
    },
    handleClientChange(clientId) {
      this.selectedClientId = clientId
      this.updateField('config-client_id', [clientId])
    },
    handleMatchConsumerChange(checked) {
      this.updateField('config-principals-match_consumer', checked)
      if (!checked) {
        this.updateField('config-principals-match_consumer_groups', false)
      }
    },
    updateField(field, value) {
      // eslint-disable-next-line vue/no-mutating-props
      this.formModel[field] = value
      this.onModelUpdated()
    },
    handleLeaveConfirmed() {
      const type = this.leavePromptType
      this.leavePromptType = null
      const geoApiServerUrl = this.formsConfig?.geoApiServerUrl
      const geo = geoApiServerUrl
        ? new URL(geoApiServerUrl).hostname.split('.')[0]
        : (this.formsConfig?.apiBaseUrl?.match(/^\/([^/]+)/)?.[1] || 'us')
      if (type === 'authServer') {
        const url = this.formsConfig?.createAuthServerUrl || `${window.location.origin}/${geo}/identity/create-auth-server`
        document.location.href = url
      } else if (type === 'client') {
        const url = this.formsConfig?.createClientUrl
          ? this.formsConfig.createClientUrl(this.selectedServer?.id)
          : `${window.location.origin}/${geo}/identity/auth-servers/${this.selectedServer?.id}/create-auth-server-client`
        document.location.href = url
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
        // Restore principals defaults
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-enabled'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-directory'] = 'default'
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-error_on_miss'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-match_consumer'] = true
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-principals-match_consumer_groups'] = true
      } else {
        // Disable principals but keep directory as 'default'
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
        // Reset local state
        this.selectedServer = null
        this.selectedClientId = null
        this.clients = []
      }
      this.onModelUpdated()
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

  a {
    display: inline;
  }
}

.principals-advanced-settings {
  margin-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-hidden-content) {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
  }

  .k-label {
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

:deep(.create-action) {
  cursor: pointer;
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

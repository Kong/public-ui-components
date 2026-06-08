<template>
  <div>
    <VueFormGenerator
      v-if="formModel.id && isEditing || !isEditing"
      class="global-fields"
      :model="formModel"
      :options="formOptions"
      :schema="globalFields"
      @model-updated="onModelUpdated"
    />

    <KTabs :tabs="tabs">
      <template #common>
        <div class="general-settings">
          <div class="link-wrapper">
            <KExternalLink
              :href="openIdConfigurationDocs"
            >
              <span class="section-header">Common Configuration Settings</span>
            </KExternalLink>
          </div>
          <div class="description">
            Parameters for enabling the OpenID Connect plugin. Set these parameters before adding authorization,
            authentication, or other advanced configuration details.
          </div>

          <OIDCPrincipals
            v-if="isKonnect && hasPrincipalsFields"
            :common-fields-schema="commonFieldsSchema"
            :form-model="formModel"
            :form-options="formOptions"
            :form-schema="formSchema"
            :is-editing="isEditing"
            :on-model-updated="onModelUpdated"
            @mode-change="handlePrincipalsModeChange"
          />
          <VueFormGenerator
            v-else-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="commonFieldsSchema"
            @model-updated="onModelUpdated"
          />

          <KLabel>Authentication methods</KLabel>
          <KMultiselect
            :key="principalsMode"
            class="auth-methods-multiselect"
            data-testid="auth-methods-multiselect"
            :items="authMethodItems"
            :model-value="selectedAuthMethods"
            placeholder="Select authentication methods"
            @update:model-value="handleAuthMethodsSelect"
          />
          <p class="auth-methods-hint">
            Configure which OAuth and OpenID Connect features are supported.
          </p>

          <div class="session-management-section">
            <KLabel>Session management</KLabel>
            <div class="session-radio-group">
              <KRadio
                v-model="sessionManagement"
                data-testid="session-radio-use"
                description="Issue a session cookie after successful authentication. Subsequent requests use the session instead of re-authenticating with the identity provider."
                label="Use sessions"
                :selected-value="true"
                @change="handleSessionChange(true)"
              />
              <KRadio
                v-model="sessionManagement"
                data-testid="session-radio-no-use"
                description="Authenticate each request using the configured authentication flow."
                label="Do not use sessions"
                :selected-value="false"
                @change="handleSessionChange(false)"
              />
            </div>
          </div>
        </div>
      </template>
      <template #authorization>
        <div class="general-settings">
          <div class="link-wrapper">
            <KExternalLink :href="openIdAuthorizationDocs">
              <span class="section-header">Authorization Configuration Settings</span>
            </KExternalLink>
          </div>
          <div class="description">
            Parameters for setting up claims-based authorization.
          </div>
          <VueFormGenerator
            v-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="authFieldsSchema"
            @model-updated="onModelUpdated"
          >
            <template #autofill-provider="slotProps">
              <slot
                name="autofill-provider"
                v-bind="slotProps"
              />
            </template>
          </VueFormGenerator>
        </div>
      </template>
      <template #advanced>
        <div class="general-settings">
          <div class="link-wrapper">
            <KExternalLink :href="openIdConnectLink">
              <span class="section-header">Advanced Configuration Settings</span>
            </KExternalLink>
          </div>
          <div class="description">
            Advanced parameters for manually configuring the OpenID Connect plugin.
          </div>
          <VueFormGenerator
            v-if="displayForm"
            :enable-redis-partial="enableRedisPartial"
            :is-editing="isEditing"
            :is-konnect-managed-redis-enabled="isKonnectManagedRedisEnabled"
            :model="formModel"
            :options="formOptions"
            :schema="advancedFieldsSchema"
            @model-updated="onModelUpdated"
            @partial-toggled="onPartialToggled"
            @show-new-partial-modal="() => showNewPartialModal(formSchema._supported_redis_partial_type)"
          />
        </div>
      </template>
    </KTabs>
  </div>
</template>

<script>
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME, FORMS_CONFIG } from '../../const'
import composables from '../../composables'
import VueFormGenerator from '../FormGenerator.vue'
import OIDCPrincipals from './OIDCPrincipals.vue'
import externalLinks from '../../external-links'

const COMMON_FIELD_MODELS = new Set([
  'config-client_id',
  'config-client_secret',
  'config-issuer',
])

const PRINCIPALS_FIELD_MODELS = new Set([
  'config-principals-enabled',
  'config-principals-directory',
  'config-principals-principal_by',
  'config-principals-principal_claim',
  'config-principals-match_consumer',
  'config-principals-match_consumer_groups',
  'config-principals-error_on_miss',
])

const AUTH_FIELD_MODELS = new Set([
  'config-scopes_claim',
  'config-scopes_required',
  'config-audience_claim',
  'config-audience_required',
  'config-roles_claim',
  'config-roles_required',
  'config-groups_claim',
  'config-groups_required',
  'config-authenticated_groups_claim',
])

export default {
  name: 'OIDCForm',
  components: { VueFormGenerator, OIDCPrincipals },
  provide() {
    // Provide AUTOFILL_SLOT
    return {
      [AUTOFILL_SLOT]: this.$slots?.[AUTOFILL_SLOT_NAME],
    }
  },
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
      default: () => { },
    },
    onModelUpdated: {
      type: Function,
      required: true,
    },
    onPartialToggled: {
      type: Function,
      required: true,
    },
    isEditing: {
      type: Boolean,
      required: true,
    },
    enableRedisPartial: {
      type: Boolean,
      required: false,
    },
    isKonnectManagedRedisEnabled: {
      type: Boolean,
      default: false,
    },
    showNewPartialModal: {
      type: Function,
      default: () => { },
    },
  },
  data() {
    return {
      init: false,
      authMethods: [],
      sessionManagement: false,
      principalsMode: null,
      globalFields: null,
      commonFieldsSchema: null,
      authFieldsSchema: null,
      openIdConnectLink: externalLinks.openIdConnectDocs,
      openIdConnectJWKLink: externalLinks.openIdConnectJWKDocs,
      openIdConnectClusterNodesLink: externalLinks.openIdConnectClusterNodesDocs,
      openIdConfigurationDocs: externalLinks.openIdConfigurationDocs,
      openIdAuthorizationDocs: externalLinks.openIdAuthorizationDocs,
      advancedFieldsSchema: {
        fields: [],
      },
      advancedFields: null,
      tabs: [
        {
          hash: '#common',
          title: 'Common',
        },
        {
          hash: '#authorization',
          title: 'Authorization',
        },
        {
          hash: '#advanced',
          title: 'Advanced',
        },
      ],
    }
  },
  computed: {
    displayForm() {
      return (this.formModel.id && this.isEditing) || !this.isEditing
    },
    hasPrincipalsFields() {
      return this.formSchema.fields?.some(
        (field) => PRINCIPALS_FIELD_MODELS.has(field.model),
      )
    },
    isKonnect() {
      return this.formsConfig?.app === 'konnect'
    },
    authMethodItems() {
      const KONG_IDENTITY_METHODS = ['bearer', 'client_credentials', 'introspection', 'userinfo']
      const methods = this.principalsMode === 'kong-identity'
        ? this.authMethods.filter(m => KONG_IDENTITY_METHODS.includes(m.value))
        : this.authMethods
      return methods.map(m => ({
        label: m.label,
        value: m.value,
      }))
    },
    selectedAuthMethods() {
      return this.authMethods.filter(m => m.prop).map(m => m.value)
    },
  },
  watch: {
    formModel: {
      handler: function() {
        this.oidcSetup()
      },
    },
  },
  mounted() {
    this.oidcSetup()
  },
  methods: {
    oidcSetup() {
      if (!this.init) {
        this.init = true
        // Pull out name, plugin enabled, and scope
        this.globalFields = {
          fields: this.formSchema.fields.filter(r => {
            return !r.model.startsWith('config') && r.model !== 'tags'
          }),
        }

        const fieldMap = this.formSchema.fields.reduce((m, f) => {
          m[f.model] = f
          return m
        }, {})

        this.commonFieldsSchema = {
          fields: Array.from(COMMON_FIELD_MODELS)
            .reduce((fields, model) => {
              const field = fieldMap[model]
              if (field) {
                fields.push(fieldMap[model])
              }
              return fields
            }, []),
        }

        this.authFieldsSchema = {
          fields: Array.from(AUTH_FIELD_MODELS)
            .reduce((fields, model) => {
              const field = fieldMap[model]
              if (field) {
                fields.push(fieldMap[model])
              }
              return fields
            }, []),
        }

        const { redis, redisModels } = composables.useRedisPartial(this.formSchema)

        this.advancedFieldsSchema = {
          fields: this.formSchema.fields
            .filter(field =>
              (field.model.startsWith('config')
                && field.model !== 'config-auth_methods'
                && !COMMON_FIELD_MODELS.has(field.model)
                && !AUTH_FIELD_MODELS.has(field.model)
                && !PRINCIPALS_FIELD_MODELS.has(field.model)
                && (!this.enableRedisPartial || !redisModels.includes(field.model))) // if redis partial is enabled, don't include redis fields in advanced
              || field.model === 'tags',
            )
            .reduce((fields, field) => {
              switch (field.model) {
                case 'config-client_jwk': {
                  if (Array.isArray(field.items?.schema?.fields)) {
                    for (const itemField of field.items.schema.fields) {
                      itemField.label = itemField.model
                    }
                  }

                  fields.push({
                    ...field,
                    link: this.openIdConnectJWKLink,
                    newElementButtonLabel: '+ Add Client JWK',
                    ...Array.isArray(field.items?.schema?.fields)
                    && field.items.schema.fields.map(itemField => ({ ...itemField, label: itemField.model })),
                  })
                  break
                }
                case 'config-session_redis_cluster_nodes': {
                  fields.push({
                    ...field,
                    link: this.openIdConnectClusterNodesLink,
                    newElementButtonLabel: '+ Add Cluster Node',
                  })
                  break
                }
                default: {
                  fields.push(field)
                }
              }

              return fields
            }, []),
        }

        // Add Redis partial to the front of advanced fields
        if (this.enableRedisPartial) this.advancedFieldsSchema.fields.unshift(redis)

        // Use checkboxes for auth methods
        this.sessionManagement = this.formModel['config-auth_methods'].includes('session')

        this.authMethods = [{
          label: 'Authorization code flow',
          value: 'authorization_code',
          hint: 'authorization code flow',
          prop: this.formModel['config-auth_methods'].includes('authorization_code'),
        },
        {
          label: 'Bearer access token',
          value: 'bearer',
          hint: 'JWT access token verification',
          prop: this.formModel['config-auth_methods'].includes('bearer'),
        }, {
          label: 'Client credentials grant',
          value: 'client_credentials',
          hint: 'OAuth client credentials grant',
          prop: this.formModel['config-auth_methods'].includes('client_credentials'),
        }, {
          label: 'Passwords grant',
          value: 'password',
          hint: 'OAuth legacy password grant',
          prop: this.formModel['config-auth_methods'].includes('password'),
        }, {
          label: 'Introspection',
          value: 'introspection',
          hint: 'OAuth introspection',
          prop: this.formModel['config-auth_methods'].includes('introspection'),
        }, {
          label: 'UserInfo',
          value: 'userinfo',
          hint: 'OpenID Connect user info endpoint authentication',
          prop: this.formModel['config-auth_methods'].includes('userinfo'),
        }, {
          label: 'Kong OAuth',
          value: 'kong_oauth2',
          hint: 'Kong OAuth plugin issued tokens verification',
          prop: this.formModel['config-auth_methods'].includes('kong_oauth2'),
        }, {
          label: 'Refresh token',
          value: 'refresh_token',
          hint: 'OAuth refresh token grant',
          prop: this.formModel['config-auth_methods'].includes('refresh_token'),
        }]

        for (const s of [this.commonFieldsSchema, this.authFieldsSchema, this.advancedFieldsSchema]) {
          for (const f of s.fields) {
            const help = fieldMap[f.model]?.help
            if (f.help === undefined && typeof help === 'string') {
              f.help = help
            }
          }
        }

        // Migrate deprecated consumer_claim → consumer_claims
        // consumer_claim is string[], consumer_claims is string[][]
        const deprecatedValue = this.formModel['config-consumer_claim']
        if (deprecatedValue !== undefined && deprecatedValue !== null && deprecatedValue !== '') {
          if (!this.formModel['config-consumer_claims'] || this.formModel['config-consumer_claims'].length === 0) {
            const claimArray = Array.isArray(deprecatedValue) ? deprecatedValue : [deprecatedValue]
            // eslint-disable-next-line vue/no-mutating-props
            this.formModel['config-consumer_claims'] = [claimArray]
            this.onModelUpdated()
          }
        }
      }
    },
    getAuthMethodsValue(prop, evt) {
      const arr = []

      for (let i = 0; i < this.authMethods.length; i++) {
        if (this.authMethods[i].prop && this.authMethods[i].value !== prop) {
          arr.push(this.authMethods[i].value)
        }
      }

      if (this.sessionManagement && !!prop) {
        arr.push('session')
      }

      // we are acting on authMethods before the change for this
      // toggle action has updated the data so lastly we need to
      // add whichever auth method was checked if the action was
      // to toggle it on
      if (evt) {
        if (!prop) { // session isn't in authMethods so doesn't have a value
          arr.push('session')
        } else {
          arr.push(prop)
        }
      }

      return arr
    },
    handleUpdate(evt, prop) {
      // eslint-disable-next-line vue/no-mutating-props
      this.formModel['config-auth_methods'] = this.getAuthMethodsValue(prop, evt)
      this.onModelUpdated()
    },
    handleAuthMethodsSelect(selectedValues) {
      // Update authMethods prop state
      for (const method of this.authMethods) {
        method.prop = selectedValues.includes(method.value)
      }
      // Build the final array including session if enabled
      const arr = [...selectedValues]
      if (this.sessionManagement) {
        arr.push('session')
      }
      // eslint-disable-next-line vue/no-mutating-props
      this.formModel['config-auth_methods'] = arr
      this.onModelUpdated()
    },
    handleSessionChange(value) {
      this.sessionManagement = value
      // Rebuild auth_methods with or without 'session'
      const arr = this.authMethods.filter(m => m.prop).map(m => m.value)
      if (value) {
        arr.push('session')
      }
      // eslint-disable-next-line vue/no-mutating-props
      this.formModel['config-auth_methods'] = arr
      this.onModelUpdated()
    },
    handlePrincipalsModeChange(mode) {
      this.principalsMode = mode
      const KONG_IDENTITY_METHODS = ['bearer', 'client_credentials', 'introspection', 'userinfo']
      if (mode === 'kong-identity') {
        // Auto-select only the 4 Kong Identity methods
        for (const method of this.authMethods) {
          method.prop = KONG_IDENTITY_METHODS.includes(method.value)
        }
        const arr = [...KONG_IDENTITY_METHODS]
        if (this.sessionManagement) {
          arr.push('session')
        }
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-auth_methods'] = arr
        this.onModelUpdated()
      } else {
        // External mode: select all auth methods by default, including session
        this.sessionManagement = true
        for (const method of this.authMethods) {
          method.prop = true
        }
        const arr = this.authMethods.map(m => m.value)
        arr.push('session')
        // eslint-disable-next-line vue/no-mutating-props
        this.formModel['config-auth_methods'] = arr
        this.onModelUpdated()
      }
    },
  },
}
</script>

<style lang="scss">
.global-fields.VueFormGenerator .form-group:last-child {
  margin-bottom: 24px;
}

.general-settings .VueFormGenerator .form-group:last-child {
  margin-bottom: 0;
}

.general-settings {
  .k-label {
    margin-bottom: 8px;
    margin-top: 24px;
  }

  .k-input-switch .k-label {
    margin-top: 0;
  }

  .auth-method-container {
    display: flex;
    flex-wrap: wrap;

    .auth-method {
      margin-bottom: 8px;
      width: 50%;
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

  .session-radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);
  }

  .session-radio-label {
    font-weight: 600;
  }

  .k-switch {
    margin: 24px 0;
  }
}

.advanced-field-dropdown {
  &.closed {
    margin-bottom: 32px;
  }

  &.open {
    margin-top: 8px;
  }
}
</style>

<style lang="scss" scoped>
.section-header {
  color: rgba(0, 0, 0, 0.85);
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: 500;
  line-height: 20px;
}

.description {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 12px;

  a {
    display: inline;
  }
}

.link-wrapper {
  margin-bottom: 8px;
}

:deep(.k-tabs ul[role="tablist"]) {
  margin-bottom: 32px;
}

:deep(.jwk-array-input-wrapper) {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  width: 400px;

  input.form-control {
    width: 300px;
  }
}

:deep(.auth-array-item-container) {
  width: 100%;
}

:deep(.auth-array-item) {
  display: flex;
  margin-top: 8px;
}

:deep(.k-button.auth-array-item-new) {
  margin-top: 24px;
}
</style>

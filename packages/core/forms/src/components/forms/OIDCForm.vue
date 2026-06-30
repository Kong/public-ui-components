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
            @click:create-entity="(payload) => $emit('click:create-entity', payload)"
            @click:learn-more="(entity) => $emit('click:learn-more', entity)"
            @mode-change="handlePrincipalsModeChange"
          >
            <!-- Authentication methods + Session management live inside the principals
                 "additional settings" collapse so there is a single advanced section. -->
            <template #advanced-fields>
              <OIDCAuthMethods
                :auth-method-items="authMethodItems"
                :principals-mode="principalsMode"
                :selected-auth-methods="selectedAuthMethods"
                :session-management="sessionManagement"
                @select="handleAuthMethodsSelect"
                @session-change="handleSessionChange"
              />
            </template>
          </OIDCPrincipals>
          <template v-else>
            <VueFormGenerator
              v-if="displayForm"
              :model="formModel"
              :options="formOptions"
              :schema="commonFieldsSchema"
              @model-updated="onModelUpdated"
            />

            <OIDCAuthMethods
              v-if="useNewAuthMethodsField"
              :auth-method-items="authMethodItems"
              :principals-mode="principalsMode"
              :selected-auth-methods="selectedAuthMethods"
              :session-management="sessionManagement"
              @select="handleAuthMethodsSelect"
              @session-change="handleSessionChange"
            />
            <template v-else>
              <KLabel>Auth methods</KLabel>
              <div class="auth-method-container">
                <div
                  v-for="method in authMethods"
                  :key="method.value"
                  class="auth-method"
                >
                  <KCheckbox
                    v-model="method.prop"
                    :data-testid="`auth-method-checkbox-${method.value}`"
                    @change="evt => handleUpdate(evt, method.value)"
                  >
                    {{ method.label }}
                  </KCheckbox>
                </div>
              </div>
              <KInputSwitch
                v-model="sessionManagement"
                data-testid="session-management-switch"
                label="Enable Session Management"
                @change="handleUpdate"
              />
            </template>
          </template>
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
import OIDCAuthMethods from './OIDCAuthMethods.vue'
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

const KONG_IDENTITY_METHODS = ['bearer', 'client_credentials', 'introspection', 'userinfo']

// Kong Identity auth servers are hosted under the identity.konghq domain; an issuer that
// does not match is an external IdP. Used to infer the principals mode on edit-load.
const KONG_IDENTITY_ISSUER_MARKER = 'identity.konghq'

const isKongIdentityIssuer = (issuer) =>
  typeof issuer === 'string' && issuer.includes(KONG_IDENTITY_ISSUER_MARKER)

export default {
  name: 'OIDCForm',
  components: { VueFormGenerator, OIDCPrincipals, OIDCAuthMethods },
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
    /**
     * Identity Principals UI feature flag (khcp-20393). When false, behave as if the
     * `principals` fields aren't in the schema — the Kong Identity principals section is
     * hidden and the legacy common-fields form renders instead.
     */
    identityPrincipalsUiEnabled: {
      type: Boolean,
      default: false,
    },
    showNewPartialModal: {
      type: Function,
      default: () => { },
    },
  },
  emits: ['click:create-entity', 'click:learn-more'],
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
      return this.identityPrincipalsUiEnabled && this.formSchema.fields?.some(
        (field) => PRINCIPALS_FIELD_MODELS.has(field.model),
      )
    },
    isKonnect() {
      return this.formsConfig?.app === 'konnect'
    },
    useNewAuthMethodsField() {
      return this.isKonnect
    },
    authMethodItems() {
      // principalsMode is set on create and on user toggles; on edit it stays
      // null (the principals child doesn't emit), so fall back to the saved issuer
      // to decide whether to restrict the list to Kong Identity methods.
      const isKongIdentity = this.principalsMode !== null
        ? this.principalsMode === 'kong-identity'
        : isKongIdentityIssuer(this.formModel['config-issuer'])
      const methods = isKongIdentity
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
                case 'config-token_exchange-subject_token_issuers': {
                  if (Array.isArray(field.items?.schema?.fields)) {
                    const itemFields = field.items.schema.fields
                    // Add help text to verify_signature and conditional visibility to jwks_uri
                    const verifySignatureField = itemFields.find(f => f.model === 'verify_signature')
                    const jwksUriField = itemFields.find(f => f.model === 'jwks_uri')

                    if (verifySignatureField) {
                      verifySignatureField.checkboxLabel = verifySignatureField.label
                      verifySignatureField.label = undefined
                      verifySignatureField.checkboxDescription = (model) => model.verify_signature === true
                        ? 'JSON Web Keys are automatically fetched from the issuer\'s well-known endpoint. Enter a JWKS URI below to override this.'
                        : undefined
                    }
                    if (jwksUriField) {
                      jwksUriField.visible = (model) => model.verify_signature === true
                    }

                    // Move jwks_uri to directly after verify_signature
                    if (verifySignatureField && jwksUriField) {
                      const vsIndex = itemFields.indexOf(verifySignatureField)
                      const jwksIndex = itemFields.indexOf(jwksUriField)
                      if (jwksIndex !== vsIndex + 1) {
                        itemFields.splice(jwksIndex, 1)
                        itemFields.splice(vsIndex + 1, 0, jwksUriField)
                      }
                    }
                  }

                  fields.push(field)
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

      if (mode === 'kong-identity') {
        if (!this.isEditing) {
          this.sessionManagement = true
        }
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

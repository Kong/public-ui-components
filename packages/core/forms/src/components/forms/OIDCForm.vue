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
              href="https://docs.konghq.com/hub/kong-inc/openid-connect/#important-configuration-parameters"
            >
              <span class="section-header">Common Configuration Settings</span>
            </KExternalLink>
          </div>
          <div class="description">
            Parameters for enabling the OpenID Connect plugin. Set these parameters before adding authorization,
            authentication, or other advanced configuration details.
          </div>
          <VueFormGenerator
            v-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="commonFieldsSchema"
            @model-updated="onModelUpdated"
          />

          <KLabel>Auth Methods</KLabel>
          <div class="auth-method-container">
            <div
              v-for="(method) in authMethods"
              :key="method.value"
              class="auth-method"
            >
              <KCheckbox
                v-model="method.prop"
                @change="evt => handleUpdate(evt, method.value)"
              >
                {{ method.label }}
              </KCheckbox>
            </div>
          </div>
          <KInputSwitch
            v-model="sessionManagement"
            label="Enable Session Management"
            @change="handleUpdate"
          />
        </div>
      </template>
      <template #authorization>
        <div class="general-settings">
          <div class="link-wrapper">
            <KExternalLink href="https://docs.konghq.com/hub/kong-inc/openid-connect/#authorization">
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
            <KExternalLink href="https://docs.konghq.com/hub/kong-inc/openid-connect/">
              <span class="section-header">Advanced Configuration Settings</span>
            </KExternalLink>
          </div>
          <div class="description">
            Advanced parameters for manually configuring the OpenID Connect plugin.
          </div>
          <VueFormGenerator
            v-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="advancedFieldsSchema"
            @model-updated="onModelUpdated"
          />
        </div>
      </template>
    </KTabs>
  </div>
</template>

<script>
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../../const'
import composables from '../../composables'
import VueFormGenerator from '../FormGenerator.vue'

const COMMON_FIELD_MODELS = new Set([
  'config-client_id',
  'config-client_secret',
  'config-issuer',
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
  components: { VueFormGenerator },
  provide() {
    // Provide AUTOFILL_SLOT
    return {
      [AUTOFILL_SLOT]: this.$slots?.[AUTOFILL_SLOT_NAME],
    }
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
    isEditing: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      init: false,
      authMethods: [],
      sessionManagement: false,
      globalFields: null,
      commonFieldsSchema: null,
      authFieldsSchema: null,
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
                && !redisModels.includes(field.model))
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
                    link: 'https://docs.konghq.com/hub/kong-inc/openid-connect/#jwk-record',
                    newElementButtonLabel: '+ Add Client JWK',
                    ...Array.isArray(field.items?.schema?.fields)
                    && field.items.schema.fields.map(itemField => ({ ...itemField, label: itemField.model })),
                  })
                  break
                }
                case 'config-session_redis_cluster_nodes': {
                  fields.push({
                    ...field,
                    link: 'https://docs.konghq.com/hub/kong-inc/openid-connect/#host-record',
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
        this.advancedFieldsSchema.fields.unshift(redis)

        // Use checkboxes for auth methods
        this.sessionManagement = this.isEditing ? this.formModel['config-auth_methods'].includes('session') : false

        this.authMethods = [{
          label: 'Authorization Code Flow',
          value: 'authorization_code',
          hint: 'authorization code flow',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('authorization_code') : false,
        },
        {
          label: 'Bearer Access Token',
          value: 'bearer',
          hint: 'JWT access token verification',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('bearer') : false,
        }, {
          label: 'Client Credentials Grant',
          value: 'client_credentials',
          hint: 'OAuth client credentials grant',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('client_credentials') : false,
        }, {
          label: 'Passwords Grant',
          value: 'password',
          hint: 'OAuth legacy password grant',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('password') : false,
        }, {
          label: 'Introspection',
          value: 'introspection',
          hint: 'OAuth introspection',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('introspection') : false,
        }, {
          label: 'UserInfo',
          value: 'userinfo',
          hint: 'OpenID Connect user info endpoint authentication',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('userinfo') : false,
        }, {
          label: 'Kong OAuth',
          value: 'kong_oauth2',
          hint: 'Kong OAuth plugin issued tokens verification',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('kong_oauth2') : false,
        }, {
          label: 'Refresh Token',
          value: 'refresh_token',
          hint: 'OAuth refresh token grant',
          prop: this.isEditing ? this.formModel['config-auth_methods'].includes('refresh_token') : false,
        }]

        for (const s of [this.commonFieldsSchema, this.authFieldsSchema, this.advancedFieldsSchema]) {
          for (const f of s.fields) {
            const help = fieldMap[f.model]?.help
            if (f.help === undefined && typeof help === 'string') {
              f.help = help
            }
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
  font-size: $kui-font-size-40;
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

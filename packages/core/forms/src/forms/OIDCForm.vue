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
            <KExternalLink href="https://docs.konghq.com/hub/kong-inc/openid-connect/#important-configuration-parameters">
              <span class="section-header">Common Configuration Settings</span>
            </KExternalLink>
          </div>
          <div class="description">
            Parameters for enabling the OpenID Connect plugin. Set these parameters before adding authorization, authentication, or other advanced configuration details.
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
          />
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
import OIDCCommonSchema from './schemas/OIDCCommon'
import OIDCAuthSchema from './schemas/OIDCAuth'
import OIDCAdvancedSchema from './schemas/OIDCAdvanced.js'
import VueFormGenerator from '../generator/FormGenerator.vue'

export default {
  name: 'OIDCForm',
  components: { VueFormGenerator },
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
      default: () => {},
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

        // init schema for autoconfig tab
        this.commonFieldsSchema = {
          ...OIDCCommonSchema,
        }

        this.authFieldsSchema = {
          ...OIDCAuthSchema,
        }

        // strip out all fields not already visible
        // use this for advanced tab
        this.advancedFieldsSchema.fields = this.formSchema.fields.filter(r => {
          return (r.model.startsWith('config') && !this.commonFieldsSchema.fields.filter(field => {
            return field.model === r.model
          }).length && !this.authFieldsSchema.fields.filter(field => {
            return field.model === r.model
          }).length) || r.model === 'tags'
        })

        this.advancedFieldsSchema.fields = this.advancedFieldsSchema.fields.map(item => {
          const findElement = OIDCAdvancedSchema.fields.find(i => i.model === item.model)

          if (findElement) {
            return findElement
          }

          return item
        })

        this.commonFieldsSchema.fields = this.commonFieldsSchema.fields.filter(r => {
          return r.model !== 'config-auth_methods'
        })

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
  .k-input-label {
    margin-bottom: 8px;
    margin-top: 24px;
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
</style>

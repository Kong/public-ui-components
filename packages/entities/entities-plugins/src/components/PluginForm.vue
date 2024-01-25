<template>
  <div class="kong-ui-entities-plugin-form-container">
    <KSkeleton
      v-if="schemaLoading"
      type="form"
    />

    <KEmptyState
      v-else-if="fetchSchemaError"
      cta-is-hidden
      data-testid="plugin-form-schema-error"
      is-error
    >
      <template #message>
        <h3>
          {{ t('errors.load_schema') }}
        </h3>
      </template>
    </KEmptyState>

    <EntityBaseForm
      v-else
      :can-submit="canSubmit"
      :config="config"
      :edit-id="pluginId"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="getRequestBody"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <!-- Having a hidden form here allows us to @submit like a native html form -->
      <form
        hidden
        @submit="saveFormData"
      />

      <PluginEntityForm
        :config="config"
        :credential="treatAsCredential"
        :editing="formType === EntityBaseFormType.Edit"
        :entity-map="entityMap"
        :record="record || undefined"
        :schema="schema || {}"
        @loading="(val: boolean) => formLoading = val"
        @model-updated="handleUpdate"
      />

      <template #form-actions>
        <!--
          Force the render of this slot
             - if isWizardStep is true we don't want any buttons displayed (default EntityBaseForm buttons included)
        -->
        <div v-if="isWizardStep" />
        <div
          v-else
          class="plugin-form-actions"
        >
          <div v-if="config.jsonYamlFormsEnabled">
            <KButton
              appearance="tertiary"
              data-testid="form-view-configuration"
              @click="toggle()"
            >
              {{ t('actions.view_configuration') }}
            </KButton>
          </div>
          <KButton
            appearance="secondary"
            class="form-action-button"
            data-testid="form-cancel"
            :disabled="form.isReadonly"
            type="reset"
            @click="handleClickCancel"
          >
            {{ t('actions.cancel') }}
          </KButton>
          <KButton
            v-if="formType === EntityBaseFormType.Create && config.backRoute"
            appearance="secondary"
            class="form-action-button"
            data-testid="form-back"
            :disabled="form.isReadonly"
            @click="handleClickBack"
          >
            {{ t('actions.back') }}
          </KButton>
          <KButton
            appearance="primary"
            data-testid="form-submit"
            :disabled="!canSubmit || form.isReadonly"
            type="submit"
            @click="saveFormData"
          >
            {{ t('actions.save') }}
          </KButton>
        </div>
      </template>
    </EntityBaseForm>
    <KSlideout
      close-button-alignment="end"
      data-testid="form-view-configuration-slideout"
      :has-overlay="false"
      :is-visible="isToggled"
      prevent-close-on-blur
      :title="t('view_configuration.title')"
      @close="toggle"
    >
      <div>
        {{ t('view_configuration.message') }}
      </div>
      <KTabs
        data-testid="form-view-configuration-slideout-tabs"
        :tabs="tabs"
      >
        <template #json>
          <JsonCodeBlock
            :config="config"
            :fetcher-url="submitUrl"
            :json-record="form.fields"
            :request-method="props.pluginId ? 'put' : 'post'"
          />
        </template>
        <template #yaml>
          <YamlCodeBlock :yaml-record="form.fields" />
        </template>
      </KTabs>
    </KSlideout>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeMount, type PropType, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import { marked, type MarkedOptions } from 'marked'
import {
  useAxios,
  useErrors,
  useHelpers,
  useStringHelpers,
  EntityBaseForm,
  EntityBaseFormType,
  JsonCodeBlock,
  YamlCodeBlock,
} from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import {
  EntityTypeIdField,
  PluginScope,
  type KonnectPluginFormConfig,
  type KongManagerPluginFormConfig,
  type PluginFormState,
  type PluginFormFields,
  type DefaultPluginsSchemaRecord,
  type DefaultPluginsFormSchema,
  type PluginEntityInfo,
} from '../types'
import endpoints from '../plugins-endpoints'
import composables from '../composables'
import { ArrayStringFieldSchema } from '../composables/plugin-schemas/ArrayStringFieldSchema'
import PluginEntityForm from './PluginEntityForm.vue'
import type { Tab } from '@kong/kongponents'

const emit = defineEmits<{
  (e: 'error:fetch-schema', error: AxiosError): void,
  (e: 'error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
  (e: 'update', data: Record<string, any>): void,
  (e: 'model-updated',
    payload: {
      model: Record<string, any>,
      data: Record<string, any>,
      resourceEndpoint: string
    }
  ): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>,
    required: true,
    validator: (config: KonnectPluginFormConfig | KongManagerPluginFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.cancelRoute) return false
      return true
    },
  },
  /** The plugin schema to be used to generate the form
   * Ex. 'acl'
   */
  pluginType: {
    type: String,
    required: true,
  },
  /** The ID of a specific plugin instance. If a valid Plugin ID is provided, it will put the form in Edit mode instead of Create */
  pluginId: {
    type: String,
    default: '',
  },

  /** Rather than using internal logic to determine whether or not to hide scope, force it */
  hideScopeSelection: {
    type: Boolean,
    default: false,
  },

  /** Credentials use */
  credential: {
    type: Boolean,
    default: false,
  },

  /** For Kong Manager portal developers */
  developer: {
    type: Boolean,
    default: false,
  },

  /** Don't render buttons and allow the host app to handle submitting the payload */
  isWizardStep: {
    type: Boolean,
    default: false,
  },

  /**
   * Support instance names for plugins. This can be removed when KHCP-5872-custom-names-for-plugins is removed.
   * Enabled by default for KM.
   */
  useCustomNamesForPlugin: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { pluginMetaData, credentialMetaData, credentialSchemas } = composables.usePluginMetaData()
const { customSchemas, typedefs } = composables.useSchemas(undefined, props.config.app)
const { getMessageFromError } = useErrors()
const { capitalize } = useStringHelpers()
const { objectsAreEqual } = useHelpers()

const { axiosInstance } = useAxios({
  headers: props.config.requestHeaders,
})

const isToggled = ref(false)
const formType = computed((): EntityBaseFormType => props.pluginId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const schema = ref<Record<string, any> | null>(null)
const treatAsCredential = computed((): boolean => !!(props.credential && props.config.entityId))
const record = ref<Record<string, any> | null>(null)
const configResponse = ref<Record<string, any>>({})
const formLoading = ref(false)
const formFieldsOriginal = reactive<PluginFormFields>({
  enabled: true,
  protocols: [],
  tags: [],
})

const form = reactive<PluginFormState>({
  fields: {
    enabled: true,
    protocols: [],
    tags: [],
  },
  isReadonly: false,
  errorMessage: '',
})

const tabs = ref<Tab[]>([
  {
    title: t('view_configuration.yaml'),
    hash: '#yaml',
  },
  {
    title: t('view_configuration.json'),
    hash: '#json',
  },
])

const fetchUrl = computed((): string => {
  if (treatAsCredential.value) { // credential
    let submitEndpoint = endpoints.form[props.config.app].credential[formType.value]

    // replace resource endpoint for credentials
    submitEndpoint = submitEndpoint.replace(/{resourceEndpoint}/gi, resourceEndpoint.value)

    return submitEndpoint
  }

  // plugin
  if (props.config.entityType && props.config.entityId) {
    return endpoints.form[props.config.app].edit.forEntity
      .replace(/{entityType}/gi, props.config.entityType)
      .replace(/{entityId}/gi, props.config.entityId)
  } else {
    return endpoints.form[props.config.app].edit.all
  }
})

const toggle = (): void => {
  isToggled.value = !isToggled.value
}

const entityMap = computed((): Record<string, PluginEntityInfo> => {
  const consumerId = (props.config.entityType === 'consumers' && props.config.entityId) || record.value?.consumer?.id
  const consumerGroupId = (props.config.entityType === 'consumer_groups' && props.config.entityId) || record.value?.consumer_group?.id
  const serviceId = (props.config.entityType === 'services' && props.config.entityId) || record.value?.service?.id
  const routeId = (props.config.entityType === 'routes' && props.config.entityId) || record.value?.route?.id

  // global plugins
  if (!(consumerId || consumerGroupId || serviceId || routeId)) {
    return {
      global: {
        entity: PluginScope.GLOBAL,
        entityEndpoint: 'plugins',
      },
    }
  }

  const entityMap: Record<string, PluginEntityInfo> = {}

  // scoped plugins
  if (serviceId) {
    entityMap.service = {
      entity: PluginScope.SERVICE,
      entityEndpoint: 'services',
      id: serviceId,
      idField: EntityTypeIdField.SERVICE,
    }
  }

  if (routeId) {
    entityMap.route = {
      entity: PluginScope.ROUTE,
      entityEndpoint: 'routes',
      id: routeId,
      idField: EntityTypeIdField.ROUTE,
    }
  }

  if (consumerId) {
    entityMap.consumer = {
      entity: PluginScope.CONSUMER,
      entityEndpoint: 'consumers',
      id: consumerId,
      idField: EntityTypeIdField.CONSUMER,
    }
  }

  if (consumerGroupId) {
    entityMap.consumer_group = {
      entity: PluginScope.CONSUMER_GROUP,
      entityEndpoint: 'consumer_groups',
      id: consumerGroupId,
      idField: EntityTypeIdField.CONSUMER_GROUP,
    }
  }

  // the actual entity requested in the config from the host app
  if (props.config.entityType) {
    entityMap.focusedEntity = {
      entity: PluginScope[props.config.entityType.substring(0, props.config.entityType.length - 1).toUpperCase() as keyof typeof EntityTypeIdField],
      entityEndpoint: props.config.entityType,
      id: props.config.entityId,
      idField: EntityTypeIdField[props.config.entityType.substring(0, props.config.entityType.length - 1).toUpperCase() as keyof typeof EntityTypeIdField],
    }
  }

  return entityMap
})

// Configuration for globally shared fields
const defaultFormSchema: DefaultPluginsSchemaRecord = reactive({
  enabled: {
    type: 'switch',
    model: 'enabled',
    label: t('plugins.form.fields.enabled.label'),
    textOn: t('plugins.form.fields.enabled.on_text'),
    textOff: t('plugins.form.fields.enabled.off_text'),
    styleClasses: 'field-switch bottom-border hide-label',
    default: true,
  },
  // this is a required field that the user cannot set, it's always the name of the plugin
  // ex. 'acl'
  name: {
    default: props.pluginType,
    type: 'input',
    inputType: 'hidden',
    styleClasses: 'd-none',
  },
  // plugin scoping
  selectionGroup: {
    type: !props.hideScopeSelection ? 'selectionGroup' : props.hideScopeSelection || (formType.value === EntityBaseFormType.Create && props.config.entityId) ? 'foreign' : 'selectionGroup',
    inputType: 'hidden',
    styleClasses: 'bottom-border hide-label',
    fields: [
      {
        label: t('plugins.form.scoping.global.label'),
        description: t('plugins.form.scoping.global.help'),
      },
    ],
  },
  // Support is feature flagged in Konnect
  ...((props.config.app === 'kongManager' || props.useCustomNamesForPlugin) && {
    instance_name: {
      default: '',
      type: 'input',
      label: t('plugins.form.fields.instance_name.label'),
      inputType: 'text',
      help: t('plugins.form.fields.instance_name.help'),
    },
  }),

  // ...props.config.app === 'kongManager'
  //   ? {
  //     'asset-id': {
  //       default: '',
  //       type: 'AutoSuggest',
  //       entity: 'assets',
  //       inputValues: {
  //         fields: ['name', 'id'],
  //       },
  //       entityDataKey: 'asset',
  //       label: t('plugins.form.fields.asset.label'),
  //       inputType: 'text',
  //       help: t('plugins.form.fields.asset.help'),
  //       placeholder: t('plugins.form.fields.asset.placeholder'),
  //     } as DefaultPluginsFormSchema,
  //   }
  //   : null,

  tags: typedefs.tags as DefaultPluginsFormSchema,
  protocols: {
    default: [],
    help: t('plugins.form.fields.protocols.help'),
    label: t('plugins.form.fields.protocols.label'),
    placeholder: t('plugins.form.fields.protocols.placeholder'),
    required: true,
    styleClasses: 'plugin-protocols-select',
    type: 'multiselect',
    values: [
      { label: 'grpc', value: 'grpc' },
      { label: 'grpcs', value: 'grpcs' },
      { label: 'http', value: 'http' },
      { label: 'https', value: 'https' },
      { label: 'tcp', value: 'tcp' },
      { label: 'tls', value: 'tls' },
      { label: 'tls_passthrough', value: 'tls_passthrough' },
      { label: 'udp', value: 'udp' },
      { label: 'ws', value: 'ws' },
      { label: 'wss', value: 'wss' },
    ],
  },
})

// This is specifically used for credential plugins and portal developer plugins
// To create an 'ACL' credential we will end up submitting to a URL like: /<entityType>/<entityId>/acl
const resourceEndpoint = computed((): string => {
  const entityPath: string = props.developer ? 'developers' : 'consumers'

  const type = credentialMetaData[props.pluginType]?.endpoint || '/plugins'

  return `${entityPath}/${props.config.entityId}${props.developer ? '/credentials' : ''}${type}`
})

const getArrayType = (list: unknown[]): string => {
  const uniqueTypes = [...(new Set(list.map(item => typeof item)))]

  return uniqueTypes.length > 1 ? 'string' : uniqueTypes[0]
}

// _ gets converted to space and capitalize each word
const formatPluginFieldLabel = (label: string) => {
  return capitalize(label.replace(/_/g, ' '))
}

const buildFormSchema = (parentKey: string, response: Record<string, any>, initialFormSchema: Record<string, any>) => {
  let schema = (response && response.fields) || []
  const pluginSchema = customSchemas[props.pluginType as keyof typeof customSchemas]
  const credentialSchema = credentialMetaData[props.pluginType]?.schema?.fields

  // schema can either be an object or an array of objects. If it's an array, convert it to an object
  if (Array.isArray(schema)) {
    schema = schema.reduce((acc, current) => {
      const key = Object.keys(current)[0]

      // If the backend schema has dashes in the field name (e.g. config.response_headers.X-Cache-Status of the proxy-cache plugin),
      // replace them with underscores because the shared form component treats dashes as separators for nested fields
      if (key.match(/-/g)) {
        acc[key.replace(/-/g, '_')] = {
          ...current[key],
          // A flag to indicate the field name has dashes originally and they are replaced with underscores.
          // When submitting the form, the underscores should be replaced with dashes again
          fieldNameHasDashes: true,
        }
      } else {
        acc[key] = current[key]
      }

      return acc
    }, {})
  }

  // alphabetically sort the schema keys and handle specifial configuration for each field type
  Object.keys(schema).sort().forEach(key => {
    const scheme = schema[key]
    const field = parentKey ? `${parentKey}-${key}` : `${key}`

    // Required, omit keys with overwrite and hidden attributes for Kong Cloud
    if (Object.prototype.hasOwnProperty.call(scheme, 'overwrite') || scheme.hidden) {
      return
    }

    if (scheme.type === 'table') {
      return buildFormSchema(field, scheme.schema, initialFormSchema)
    }

    if (scheme.fields) {
      return buildFormSchema(field, scheme, initialFormSchema)
    }

    initialFormSchema[field] = { id: field } // each field's key will be set as the id
    initialFormSchema[field].type = scheme.type === 'boolean' ? 'checkbox' : 'input'

    if (field.startsWith('config-')) {
      initialFormSchema[field].label = formatPluginFieldLabel(field)
    }

    // Apply descriptions from BE schema
    // KAG-3347: Add /config-.*/ to cover deep fields like `config.redis.*` in the rate-limiting-advanced plugin
    if (parentKey === 'config' || parentKey.startsWith('config-')) {
      if (schema[key]?.description) {
        initialFormSchema[field].help = marked.parse(schema[key].description, { mangle: false, headerIds: false } as MarkedOptions)
      }
    }

    // map -> object-advanced
    if (scheme.type === 'map') {
      initialFormSchema[field].type = 'object-advanced'

      if (scheme.values.type === 'array') {
        const { type: elementsType } = scheme.values.elements || {}

        initialFormSchema[field].schema = {
          fields: [{
            schema: {
              fields: [{
                ...ArrayStringFieldSchema,
                model: field,
                valueArrayType: elementsType === 'integer' ? 'number' : elementsType || 'string',
                inputAttributes: {
                  ...ArrayStringFieldSchema.inputAttributes,
                  type: elementsType === 'integer' ? 'number' : 'text',
                  inputMode: elementsType === 'integer' ? 'numeric' : 'text',
                },
              }],
            },
          }],
        }
      } else if (scheme.values.fields) {
        initialFormSchema[field].schema = {
          fields: [
            {
              type: 'object',
              model: 'object',
              schema: {
                fields: scheme.values.fields.map((f: Record<string, any>) => {
                  const modelName = Object.keys(f)[0]

                  return {
                    model: modelName,
                    type: 'input',
                    label: capitalize(modelName),
                    placeholder: modelName,
                    inputType: f[modelName].type,
                  }
                }),
              },
            },
          ],
        }
      }

      return initialFormSchema
    }

    // enum -> checklist
    if (scheme.enum && scheme.type === 'array') {
      initialFormSchema[field].type = 'checklist'
      initialFormSchema[field].values = scheme.enum
      initialFormSchema[field].multi = true
      initialFormSchema[field].multiSelect = true
    }

    // one_of indicates a select
    if (scheme.one_of && scheme.type !== 'array') {
      initialFormSchema[field].type = 'select'
      initialFormSchema[field].values = scheme.one_of
      initialFormSchema[field].selectOptions = {
        noneSelectedText: t('plugins.form.no_selection'),
      }
    }

    if (scheme.elements && scheme.type === 'array') {
      const elements = scheme.elements
      if (elements.type === 'string' && !elements.one_of) {
        const { help, label, hint } = initialFormSchema[field]
        const { help: helpOverride, ...overrides } = JSON.parse(JSON.stringify(ArrayStringFieldSchema))
        initialFormSchema[field] = { help, label, hint, ...overrides }
        // Only replace the help text when it is not defined because ArrayStringFieldSchema is more generic
        if (initialFormSchema[field].help === undefined && typeof helpOverride === 'string') {
          initialFormSchema[field].help = marked.parse(helpOverride, { mangle: false, headerIds: false } as MarkedOptions)
        }
      }
    }

    if (scheme.hint) {
      initialFormSchema[field].hint = scheme.hint
    }

    // Custom frontend schema override
    if (pluginSchema && !pluginSchema.overwriteDefault) {
      Object.keys(pluginSchema).forEach(plugin => {
        // Check if current plugin matches any of custom schema keys
        if (plugin === field) {
          // Use custom defined schema instead of building from default && set field label
          const { help, label, hint } = initialFormSchema[field]
          const { help: helpOverride, ...overrides } = pluginSchema[plugin as keyof typeof pluginSchema] as Record<string, any>
          initialFormSchema[field] = { help, label, hint, ...overrides }
          // Eagerly replace the help text because we are overriding
          if (typeof helpOverride === 'string') {
            initialFormSchema[field].help = marked.parse(helpOverride, { mangle: false, headerIds: false } as MarkedOptions)
          }
        }
      })
    }

    // Apply descriptions from BE schema
    // KAG-3347: Fix help text in nested fields like `metrics` in the datadog and `parameter_schema`
    // in the request-validator plugin
    if (scheme.type === 'array' && scheme.elements?.type === 'record' && Array.isArray(scheme.elements.fields)) {
      let schemaFieldMap: Record<string, { description?: string }> = {}

      for (const field of scheme.elements.fields) {
        schemaFieldMap = { ...schemaFieldMap, ...field }
      }

      const itemFields = initialFormSchema[field]?.items?.schema?.fields
      if (Array.isArray(itemFields)) {
        for (const itemField of initialFormSchema[field].items.schema.fields) {
          const description = schemaFieldMap[itemField.model]?.description
          // Only replace the help text when it is not defined because it may have already been
          // overridden by the previous step
          if (itemField.help === undefined && typeof description === 'string') {
            itemField.help = marked.parse(description, { mangle: false, headerIds: false } as MarkedOptions)
          }
        }
      }

    }

    if (treatAsCredential.value && props.config.app === 'kongManager' && credentialSchema) {
      for (let i = 0; i < credentialSchema.length; i++) {
        if (credentialSchema[i][field]) {
          initialFormSchema[field] = {
            ...initialFormSchema[field],
            ...credentialSchema[i][field],
          }
          break
        }
      }
    }

    // required fields, if it's boolean (a checkbox) it will be marked as required even though it isn't
    if (scheme.required && scheme.type !== 'boolean') {
      initialFormSchema[field].required = true
      initialFormSchema[field].selectOptions = {
        hideNoneSelectedText: true,
      }
    }

    // Default is set and is not an object or string 'function'
    if (scheme.default != null && typeof scheme.default !== 'object' && scheme.default !== 'function') {
      initialFormSchema[field].default = scheme.default
    }

    // Field type is an input, determine input type, such as 'text', or 'number'
    if (initialFormSchema[field].type === 'input') {
      const { type: elementsType } = scheme.elements || {}

      if (elementsType) {
        initialFormSchema[field].valueArrayType = elementsType === 'integer' ? 'number' : elementsType
      }

      initialFormSchema[field].inputType = scheme.type === 'array' || scheme.type === 'string'
        ? 'text'
        : scheme.type
    }

    // Determine schema value type by interpretation of defaults or enum values
    let valueType = 'string'

    if (scheme.enum) {
      valueType = getArrayType(scheme.enum)
    } else if (scheme.type === 'boolean') {
      valueType = 'boolean'
    } else if (scheme.type === 'number' || scheme.type === 'integer') {
      valueType = 'number'
      initialFormSchema[field].inputType = 'number'
    } else if (scheme.type === 'array' || scheme.type === 'set') {
      valueType = 'array'
      initialFormSchema[field].default = scheme.default
      // If an array/set field requires to be non-empty,
      // commit null instead of an empty array/set.
      // Fixes INTF-2938
      if (scheme.len_min > 0) {
        initialFormSchema[field].submitWhenNull = true
      }
    } else if (scheme.type === 'foreign') {
      valueType = 'object'
    } else if (scheme.default && Array.isArray(scheme.default)) {
      valueType = 'array'
      initialFormSchema[field].valueArrayType = getArrayType(scheme.default)
    } else if (scheme.default) {
      valueType = typeof scheme.default
    }

    initialFormSchema[field].valueType = valueType
    if (scheme.fieldNameHasDashes) {
      initialFormSchema[field].fieldNameHasDashes = true
    }
  })

  console.log(toRaw(initialFormSchema))

  initialFormSchema['asset-id'] = {
    default: '',
    type: 'AutoSuggest',
    entity: 'assets',
    inputValues: {
      fields: ['name', 'id'],
    },
    entityDataKey: 'asset',
    label: t('plugins.form.fields.asset.label'),
    inputType: 'text',
    help: t('plugins.form.fields.asset.help'),
    placeholder: t('plugins.form.fields.asset.placeholder'),
  }

  return initialFormSchema
}

const initScopeFields = (): void => {
  const supportServiceScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.SERVICE) ?? true
  const supportRouteScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.ROUTE) ?? true
  const supportConsumerScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.CONSUMER) ?? true
  const supportConsumerGroupScope = props.config.disableConsumerGroupScope
    ? false
    : (pluginMetaData[props.pluginType]?.scope.includes(PluginScope.CONSUMER_GROUP) ?? true)

  const scopeEntityArray = []

  // if the plugin is enabled for a specific type of entity, add it's scope field to the form
  if (supportServiceScope) {
    scopeEntityArray.push({
      model: 'service-id',
      label: t('plugins.form.scoping.gateway_service.label'),
      placeholder: t('plugins.form.scoping.gateway_service.placeholder'),
      type: 'AutoSuggest',
      entity: 'services',
      inputValues: {
        fields: ['name', 'id'],
      },
      help: t('plugins.form.scoping.gateway_service.help'),
    })
  }

  if (supportRouteScope) {
    scopeEntityArray.push({
      model: 'route-id',
      label: t('plugins.form.scoping.route.label'),
      placeholder: t('plugins.form.scoping.route.placeholder'),
      type: 'AutoSuggest',
      entity: 'routes',
      inputValues: {
        fields: ['name', 'id'],
        primaryField: 'id',
      },
      help: t('plugins.form.scoping.route.help'),
    })
  }

  if (supportConsumerScope) {
    scopeEntityArray.push({
      model: 'consumer-id',
      label: t('plugins.form.scoping.consumer.label'),
      placeholder: t('plugins.form.scoping.consumer.placeholder'),
      type: 'AutoSuggest',
      entity: 'consumers',
      inputValues: {
        fields: ['username', 'custom_id', 'id'],
        primaryField: 'username',
      },
      help: t('plugins.form.scoping.consumer.help'),
    })
  }

  if (supportConsumerGroupScope) {
    scopeEntityArray.push({
      model: 'consumer_group-id',
      label: t('plugins.form.scoping.consumer_group.label'),
      placeholder: t('plugins.form.scoping.consumer_group.placeholder'),
      type: 'AutoSuggest',
      entity: 'consumer_groups',
      entityDataKey: 'consumer_group',
      inputValues: {
        fields: ['name', 'id'],
        primaryField: 'name',
      },
      help: t('plugins.form.scoping.consumer_group.help'),
    })
  }

  if (scopeEntityArray.length) {
    const scopeEntities = [
      ...supportServiceScope ? ['service'] : [],
      ...supportRouteScope ? ['route'] : [],
      ...supportConsumerScope ? ['consumer'] : [],
      ...supportConsumerGroupScope ? ['consumer_group'] : [],
    ]

    // TODO: correct string concat
    // Building the description strings for global vs. scoped radio buttons
    const trailingEntities = scopeEntities.splice(scopeEntities.length - 2, 2).map((entityType: string) => entityType === 'service' ? t('plugins.form.scoping.gateway_service.plural') : t(`plugins.form.scoping.${entityType}.plural` as keyof typeof t))
    const trailingText = trailingEntities.join(`${scopeEntities.length > 0 ? ',' : ''} and/or `)

    const desc = [
      'Specific',
      [
        ...scopeEntities.length > 0
          ? [scopeEntities.map((entityType: string) =>
            entityType === 'service' ? t('plugins.form.scoping.gateway_service.plural') : t(`plugins.form.scoping.${entityType}.plural` as keyof typeof t),
          ).join(', ')]
          : [],
        trailingText,
      ].join(', '),
    ].join(' ')

    defaultFormSchema.selectionGroup.fields.push({
      label: t('plugins.form.scoping.label'),
      description: desc,
      fields: [],
    })

    defaultFormSchema.selectionGroup.fields[1].fields = scopeEntityArray
  }

  // apply custom front-end schema if overwriteDefault is true
  if (customSchemas[props.pluginType as keyof typeof customSchemas] && customSchemas[props.pluginType as keyof typeof customSchemas].overwriteDefault) {
    if (Object.hasOwnProperty.call(customSchemas[props.pluginType as keyof typeof customSchemas], 'formSchema')) {
      Object.assign(defaultFormSchema, customSchemas[props.pluginType as keyof typeof customSchemas].formSchema)
    }
  }
}

const changesExist = computed(() => {
  return !objectsAreEqual(form.fields, formFieldsOriginal, true)
})

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal when editing, return false
 */
const canSubmit = computed((): boolean => !schemaLoading.value && !formLoading.value && (formType.value === EntityBaseFormType.Create || changesExist.value))

const initialized = ref(false)
// The whole purpose of this function is to wait for the existing record to be loaded if editing
// We need to wait for this before we start attempting to build the schema
const initForm = (data: Record<string, any>): void => {
  form.fields.id = data?.id || undefined

  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)

  record.value = data
  initialized.value = true
}

const submitPayload = ref<Record<string, any>>({})
// fired whenever form data is modified
const handleUpdate = (payload: Record<string, any>) => {
  form.fields = payload.model
  form.fields.id = record.value?.id || undefined
  Object.assign(formFieldsOriginal, payload.originalModel)
  submitPayload.value = payload.data

  // wizard relies on model-updated since action buttons are hidden
  if (props.isWizardStep) {
    emit('model-updated', {
      model: form.fields,
      data: payload.data,
      resourceEndpoint: resourceEndpoint.value,
    })
  }
}

watch([entityMap, initialized], (newData, oldData) => {
  const newEntityData = newData[0] !== oldData[0]
  const newinitialized = newData[1]
  const oldinitialized = oldData[1]

  // rebuild schema if its not a credential and we either just determined a new entity id, or newly initialized the data
  if (!treatAsCredential.value && formType.value === EntityBaseFormType.Edit && (newEntityData || (newinitialized && newinitialized !== oldinitialized))) {
    schemaLoading.value = true

    schema.value = buildFormSchema('config', configResponse.value, defaultFormSchema)
    schemaLoading.value = false
  }
}, { deep: true })

/**
 * ---------------
 * Actions
 * ---------------
 */
const handleClickCancel = (): void => {
  if (props.config.cancelRoute) {
    router.push(props.config.cancelRoute)
  }
}

const handleClickBack = (): void => {
  if (props.config.backRoute) {
    router.push(props.config.backRoute)
  }
}

/*
 * ---------------
 * Saving
 * ---------------
 */

/**
 * Build the validate URL. Currently doesn't work for credentials.
 */
const validateSubmitUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].validate}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.pluginId)

  return url
})

/**
 * Build the submit URL
 */
const submitUrl = computed((): string => {
  const isScoped = props.config.entityType && props.config.entityId && !props.developer
  // plugin endpoint vs credential endpoint
  const submitEndpoint = !treatAsCredential.value
    ? endpoints.form[props.config.app][formType.value][isScoped ? 'forEntity' : 'all']
    : endpoints.form[props.config.app].credential[formType.value]

  let url = `${props.config.apiBaseUrl}${submitEndpoint}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  // replace resource endpoint for credentials
  url = url.replace(/{resourceEndpoint}/gi, resourceEndpoint.value)
  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.pluginId)
  // replace entityType and entityId if scoped
  url = url.replace(/{entityType}/gi, props.config.entityType || '')
  url = url.replace(/{entityId}/gi, props.config.entityId || '')

  return url
})

const isCustomPlugin = computed((): boolean => {
  return !Object.keys(pluginMetaData).includes(props.pluginType)
})

const getRequestBody = computed((): Record<string, any> => {
  const requestBody: Record<string, any> = submitPayload.value
  // credentials incorrectly build the entity id object
  if (treatAsCredential.value) {
    for (const key in PluginScope) {
      const entityKey = PluginScope[key as keyof typeof PluginScope]
      // ex. { consumer: '1234-567-899' } => { consumer: { id: '1234-567-899' } }
      if (requestBody[entityKey] && !requestBody[entityKey].id) {
        requestBody[entityKey] = { id: props.config.entityId }
      }
    }

    delete requestBody.created_at
  }
  return requestBody
})

// make the actual API request to save on create/edit
const saveFormData = async (): Promise<void> => {
  // if save/cancel buttons are hidden, don't submit on hitting Enter
  if (props.isWizardStep) {
    return
  }

  try {
    form.isReadonly = true

    let response: AxiosResponse | undefined

    // TODO: determine validate URL for credentials
    // don't validate custom plugins
    if (!treatAsCredential.value && !isCustomPlugin.value) {
      await axiosInstance.post(validateSubmitUrl.value, getRequestBody.value)
    }

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, getRequestBody.value)
    } else if (formType.value === 'edit') {
      response = props.config.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, getRequestBody.value)
        : await axiosInstance.patch(submitUrl.value, getRequestBody.value)
    }

    // Set initial state of `formFieldsOriginal` to these values in order to detect changes
    Object.assign(formFieldsOriginal, form.fields)

    // Emit an update event for the host app to respond to
    emit('update', response?.data)
  } catch (error: any) {
    form.errorMessage = getMessageFromError(error)
    // Emit the error for the host app
    emit('error', error)
  } finally {
    form.isReadonly = false
  }
}

// for fetching the plugin form schema
const schemaUrl = computed((): string => {
  const pluginType = !treatAsCredential.value ? props.pluginType : credentialMetaData[props.pluginType]?.schemaEndpoint
  const schemaEndpoint = !treatAsCredential.value ? endpoints.form[props.config.app].pluginSchema : endpoints.form[props.config.app].credentialSchema

  let url = `${props.config.apiBaseUrl}${schemaEndpoint}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  // replace the plugin type
  url = url.replace(/{plugin}/gi, pluginType)

  return url
})

const schemaLoading = ref(false)
const fetchSchemaError = ref('')
onBeforeMount(async () => {
  schemaLoading.value = true

  try {
    // handling for plugin credentials (Konnect)
    if (treatAsCredential.value && props.config.app === 'konnect') {
      // credential schema endpoints don't exist for Konnect, so we use hard-coded schemas
      const pluginType = credentialMetaData[props.pluginType]?.schemaEndpoint
      const data = credentialSchemas[pluginType]

      schema.value = buildFormSchema('', data, {})
      schemaLoading.value = false
    } else { // handling for standard plugins
      const response = await axiosInstance.get(schemaUrl.value)
      const { data } = response

      if (data) {
        if (treatAsCredential.value) {
          // credential schema response is structured differently, no `config` object or default schema
          schema.value = buildFormSchema('', data, {})
          schemaLoading.value = false
        } else {
          // start from the config part of the schema
          const configField = data.fields.find((field: Record<string, any>) => field.config)
          configResponse.value = configField ? configField.config : response

          // scoping and global field setup
          initScopeFields()

          const protocolsField = data.fields.find((field: Record<string, any>) => field.protocols)?.protocols

          if (protocolsField) {
            const { default: defaultValues = [], elements = {} } = protocolsField

            defaultFormSchema.protocols.default = defaultValues

            if (elements.one_of?.length) {
              defaultFormSchema.protocols.values = elements.one_of.map((value: string) => ({ label: value, value }))
            }
          }

          // if editing, wait for record to load before building schema
          if (initialized.value || formType.value === EntityBaseFormType.Create) {
            schema.value = buildFormSchema('config', configResponse.value, defaultFormSchema)
          }
        }
      }
    }
  } catch (error: any) {
    fetchSchemaError.value = getMessageFromError(error)
    // Emit the error for the host app
    emit('error:fetch-schema', error)
  } finally {
    schemaLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-form-container {
  width: 100%;

  .form-action-button {
    margin-left: $kui-space-60;
  }

  .plugin-form-actions {
    display: flex;
  }

  & :deep(.k-slideout-title) {
    color: $kui-color-text !important;
    font-size: $kui-font-size-70 !important;
    font-weight: $kui-font-weight-bold !important;
    line-height: $kui-line-height-60 !important;
    margin-bottom: $kui-space-60 !important;
  }

  & :deep(.k-card.content-card) {
    padding: $kui-space-0 $kui-space-60 !important;
  }

  & :deep(.tab-item > div.tab-link.has-panels) {
    color: $kui-color-text-neutral !important;
    font-size: $kui-font-size-30 !important;
    font-weight: $kui-font-weight-bold !important;
    line-height: $kui-line-height-40 !important;
  }

  & :deep(.tab-item.active > div.tab-link.has-panels) {
    color: $kui-color-text !important;
    font-weight: $kui-font-weight-semibold !important;
  }
}
</style>

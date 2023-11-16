<template>
  <div class="kong-ui-entities-plugin-form-container">
    <KSkeleton
      v-if="schemaLoading"
      type="form"
    />

    <KEmptyState
      v-else-if="fetchSchemaError"
      cta-is-hidden
      is-error
    >
      <template #message>
        <h3>
          {{ t('errors.load_schema') }}
        </h3>
      </template>
    </KEmptyState>

    <KEmptyState
      v-else-if="isDisabled"
      cta-is-hidden
      is-error
    >
      <template #title>
        {{ t('plugins.form.disabled_warning') }}
      </template>
    </KEmptyState>

    <EntityBaseForm
      v-else
      :can-submit="canSubmit"
      :config="config"
      :edit-id="pluginId"
      :error-message="form.errorMessage"
      :fetch-url="fetchUrl"
      :is-readonly="form.isReadonly"
      @cancel="handleClickCancel"
      @fetch:error="(err: any) => $emit('error', err)"
      @fetch:success="initForm"
      @loading="(val: boolean) => $emit('loading', val)"
      @submit="saveFormData"
    >
      <!-- Having a hidden form here allows us to @submit like a native html form -->
      <form
        hidden
        @submit="saveFormData"
      />

      <PluginEntityForm
        :config="config"
        :entity-id="entityData.id"
        :entity-type="entityData.entity"
        :is-credential="treatAsCredential"
        :is-editing="formType === EntityBaseFormType.Edit"
        :record="record || undefined"
        :schema="schema ?? {}"
        @loading="(val: boolean) => formLoading = val"
        @model-updated="handleUpdate"
      />

      <template
        v-if="!isWizardStep"
        #form-actions
      >
        <KButton
          appearance="outline"
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
          class="form-back-button"
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
      </template>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeMount, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import { marked, type MarkedOptions } from 'marked'
import { useAxios, useErrors, useHelpers, useStringHelpers, EntityBaseForm, EntityBaseFormType } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
import {
  PluginScope,
  type KonnectPluginFormConfig,
  type KongManagerPluginFormConfig,
  type PluginFormState,
  type PluginFormFields,
  type DefaultPluginsSchemaRecord,
  type DefaultPluginsFormSchema,
  type EntityType,
  type PluginEntityInfo,
} from '../types'
import endpoints from '../plugins-endpoints'
import composables from '../composables'
import { ArrayStringFieldSchema } from '../composables/plugin-schemas/ArrayStringFieldSchema'
import PluginEntityForm from './PluginEntityForm.vue'

const emit = defineEmits<{
  (e: 'fetch-schema:error', error: AxiosError): void,
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

  hideScopeSelection: {
    type: Boolean,
    default: false,
  },

  /** Credentials use */
  isCredential: {
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
const { customSchemas, typedefs } = composables.useSchemas()
const { getMessageFromError } = useErrors()
const { capitalize } = useStringHelpers()
const { objectsAreEqual } = useHelpers()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.pluginId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const schema = ref<Record<string, any> | null>(null)
const treatAsCredential = computed((): boolean => !!(props.isCredential && props.config.entityId))
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

const isDisabled = computed((): boolean => {
  const currentPlugin = Object.keys(customSchemas).find((key: string) => key === props.pluginType)

  return currentPlugin ? (customSchemas[currentPlugin as keyof typeof customSchemas] as Record<string, any>)?.configurationDisabled : false
})

const entityData = computed((): PluginEntityInfo => {
  const consumerId = (props.config.entityType === 'consumers' && props.config.entityId) || record.value?.consumer?.id
  const consumerGroupId = (props.config.entityType === 'consumer_groups' && props.config.entityId) || record.value?.consumer_group?.id
  const serviceId = (props.config.entityType === 'services' && props.config.entityId) || record.value?.service?.id
  const routeId = (props.config.entityType === 'routes' && props.config.entityId) || record.value?.route?.id

  let entity = PluginScope.GLOBAL
  let endpoint = props.config.entityType || 'plugins'

  if (consumerId) {
    entity = PluginScope.CONSUMER
    endpoint = 'consumers'
  } if (consumerGroupId) {
    entity = PluginScope.CONSUMER_GROUP
    endpoint = 'consumer_groups'
  } else if (routeId) {
    entity = PluginScope.ROUTE
    endpoint = 'routes'
  } else if (serviceId) {
    entity = PluginScope.SERVICE
    endpoint = 'services'
  }

  return {
    entity,
    entityEndpoint: endpoint,
    id: consumerId || consumerGroupId || serviceId || routeId,
  }
})

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
  name: {
    default: props.pluginType,
    type: 'input',
    inputType: 'hidden',
    styleClasses: 'd-none',
  },
  selectionGroup: {
    type: props.hideScopeSelection || (formType.value === EntityBaseFormType.Create && props.config.entityId) ? 'foreign' : 'selectionGroup',
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

// This is specifically used for credential plugins
const resourceEndpoint = computed((): string => {
  const entityPath: EntityType = entityData.value.entityEndpoint

  let type = '/plugins'
  if (treatAsCredential.value) {
    type = credentialMetaData[props.pluginType]?.endpoint
  }

  return `${entityPath}/${props.config.entityId}${type}`
})

const getArrayType = (list: unknown[]): string => {
  const uniqueTypes = [...(new Set(list.map(item => typeof item)))]

  return uniqueTypes.length > 1 ? 'string' : uniqueTypes[0]
}

const formatPluginFieldLabel = (label: string) => {
  return capitalize(label.replace(/_/g, ' '))
}

const buildFormSchema = (parentKey: string, response: Record<string, any>, initialFormSchema: Record<string, any>) => {
  let schema = (response && response.fields) || []
  const pluginSchema = customSchemas[props.pluginType as keyof typeof customSchemas]

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

    initialFormSchema[field] = { id: field }
    initialFormSchema[field].type = scheme.type === 'boolean' ? 'checkbox' : 'input'

    if (field.startsWith('config-')) {
      initialFormSchema[field].label = formatPluginFieldLabel(field)
    }

    if (parentKey === 'config') {
      if (schema[key]?.description) {
        initialFormSchema[field].help = marked.parse(schema[key].description, { mangle: false, headerIds: false } as MarkedOptions)
      }
    }

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

    if (scheme.enum && scheme.type === 'array') {
      initialFormSchema[field].type = 'checklist'
      initialFormSchema[field].values = scheme.enum
      initialFormSchema[field].multi = true
      initialFormSchema[field].multiSelect = true
    }

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
        const { help, label } = initialFormSchema[field]

        initialFormSchema[field] = { ...JSON.parse(JSON.stringify(ArrayStringFieldSchema)), help, label }
      }
    }

    // Custom frontend schema override
    if (pluginSchema && !pluginSchema.overwriteDefault) {
      Object.keys(pluginSchema).forEach(plugin => {
        // Check if current plugin matches any of custom schema keys
        if (plugin === field) {
          // Use custom defined schema instead of building from default && set field label
          const { help, label } = initialFormSchema[field]

          initialFormSchema[field] = { help, label, ...(pluginSchema[plugin as keyof typeof pluginSchema] as Record<string, any>) }
        }
      })
    }

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
        ? (scheme.encrypted ? 'password' : 'text')
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

  return initialFormSchema
}

const initScopeFields = (): void => {
  const supportServiceScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.SERVICE) ?? true
  const supportRouteScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.ROUTE) ?? true
  const supportConsumerScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.CONSUMER) ?? true
  const supportConsumerGroupScope = pluginMetaData[props.pluginType]?.scope.includes(PluginScope.CONSUMER_GROUP) ?? true

  const scopeEntityArray = []

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
const initForm = (data: Record<string, any>): void => {
  form.fields.id = data?.id || undefined

  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)

  record.value = data
  initialized.value = true
}

const submitPayload = ref<Record<string, any>>({})
const handleUpdate = (payload: Record<string, any>) => {
  form.fields = payload.model
  form.fields.id = record.value?.id || undefined
  Object.assign(formFieldsOriginal, payload.originalModel)
  submitPayload.value = payload.data

  if (props.isWizardStep) {
    emit('model-updated', {
      model: form.fields,
      data: payload.data,
      resourceEndpoint: resourceEndpoint.value,
    })
  }
}

watch([entityData, initialized], (newData, oldData) => {
  const newId = newData[0] !== oldData[0]
  const newinitialized = newData[1]
  const oldinitialized = oldData[1]

  // rebuild schema if its not a credential and we either just determined a new entity id, or newly initialized the data
  if (!treatAsCredential.value && formType.value === EntityBaseFormType.Edit && (newId || (newinitialized && newinitialized !== oldinitialized))) {
    schemaLoading.value = true

    schema.value = buildFormSchema('config', configResponse.value, defaultFormSchema)
    schemaLoading.value = false
  }
})

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
 * Saving
 */

/**
 * Build the validate and submit URL
 */
const validateSubmitUrl = computed((): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].validate}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.pluginId)

  return url
})

/**
 * Build the submit URL
 */
const submitUrl = computed((): string => {
  // plugin endpoint vs credential endpoint
  const submitEndpoint = !treatAsCredential.value ? endpoints.form[props.config.app][formType.value] : endpoints.form[props.config.app].credential[formType.value]

  let url = `${props.config.apiBaseUrl}${submitEndpoint}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // replace resource endpoint for credentials
  url = url.replace(/{resourceEndpoint}/gi, resourceEndpoint.value)
  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.pluginId)

  return url
})

const saveFormData = async (): Promise<void> => {
  // if save/cancel buttons are hidden, don't submit on hitting Enter
  if (props.isWizardStep) {
    return
  }

  try {
    form.isReadonly = true

    const requestBody: Record<string, any> = submitPayload.value
    let response: AxiosResponse | undefined

    // credentials incorrectly build the entity id object
    if (treatAsCredential.value) {
      for (const key in PluginScope) {
        const entityKey = PluginScope[key as keyof typeof PluginScope]
        // ex. { consumer: '1234-567-899' } => { consumer: { id: '1234-567-899' } }
        if (requestBody[entityKey] && !requestBody[entityKey].id) {
          requestBody[entityKey] = { id: props.config.entityId }
        }
      }
    }

    // TODO: determine validate URL for credentials
    if (!treatAsCredential.value) {
      await axiosInstance.post(validateSubmitUrl.value, requestBody)
    }

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, requestBody)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, requestBody)
        : await axiosInstance.patch(submitUrl.value, requestBody)
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

const schemaUrl = computed((): string => {
  const pluginType = !treatAsCredential.value ? props.pluginType : credentialMetaData[props.pluginType]?.schemaEndpoint
  const schemaEndpoint = !treatAsCredential.value ? endpoints.form[props.config.app].pluginSchema : endpoints.form[props.config.app].credentialSchema

  let url = `${props.config.apiBaseUrl}${schemaEndpoint}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
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
    if (treatAsCredential.value && props.config.app === 'konnect') {
      // credential schema endpoints don't exist for Konnect, so we use hard-coded schemas
      const pluginType = credentialMetaData[props.pluginType]?.schemaEndpoint
      const data = credentialSchemas[pluginType]

      schema.value = buildFormSchema('', data, {})
      schemaLoading.value = false
    } else {
      const response = await axiosInstance.get(schemaUrl.value)
      const { data } = response

      if (data) {
        if (treatAsCredential.value) {
          // credential schema response is structured differently
          schema.value = buildFormSchema('', data, {})
          schemaLoading.value = false
        } else {
          // start from the config part of the schema
          const configField = data.fields.find((field: Record<string, any>) => field.config)
          configResponse.value = configField ? configField.config : response

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
    emit('fetch-schema:error', error)
  } finally {
    schemaLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-form-container {
  width: 100%;

  .form-back-button {
    margin-left: $kui-space-60;
  }
}
</style>

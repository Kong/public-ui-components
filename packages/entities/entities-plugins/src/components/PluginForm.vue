<template>
  <div class="kong-ui-entities-plugin-form-container">
    <!-- TODO: I think I have to start with a loading state? -->
    <EntityBaseForm
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
      <!-- TODO: rip out ALL action/button related props, like:
        :button-text="t('actions.save')"
        :hide-submit="true"
         entity="plugins"
        :entity-data="entityData"
        entity-name="Plugin"
        :fields="fields"
        :on-delete="onDeleteWhenEditing"
        :on-form-back="onBack"
        :on-form-cancel="onCancel"
        :on-load="onFormLoad"
        :on-submit="onFormSubmit"
        :prevent-submission-before-change="isEditing"
        :resource-endpoint="resourceEndpoint"
        @clicked-submit="(payload) => $emit('clicked-submit', payload)"

        Can we also remove entity / entity-name?
      -->
      <PluginEntityForm
        v-if="!isDisabled && !schemaLoading"
        :config="config"
        :is-editing="formType === EntityBaseFormType.Edit"
        :record="record || undefined"
        :schema="schema ?? {}"
        @model-updated="handleUpdate"
      >
      <!-- <template #body-header-description>
        <div v-if="useCustomNamesForPlugin">
          <KExternalLink
            :href="docsLink"
            :style="{ textDecoration: 'underline'}"
          >
            {{ helpText.general.viewDocs }}
          </KExternalLink>
        </div>
        <div v-else>
          {{ helpText.list.subtitle }}
          <KExternalLink :href="docsLink">
            {{ helpText.general.externalLinkText }}
          </KExternalLink>
        </div>
      </template>

      <template #afterFormContainer>
        <div class="after-form-wrapper">
          <KAlert
            v-if="warningMessage"
            :alert-message="warningMessage"
            appearance="warning"
            class="warning-alert"
          />

          <KSkeleton
            v-if="isLoading"
            :delay-milliseconds="0"
            type="form"
          />

          <KEmptyState
            v-if="error"
            cta-is-hidden
            is-error
          >
            <template #message>
              <h5
                class="empty-state-message"
              >
                {{ helpText.form.defaultErrorMessage }}
              </h5>
            </template>
          </KEmptyState>

          <KEmptyState
            v-if="isDisabled && !isLoading"
            :message="helpText.form.disabledWarningText"
          >
            <template #title>
              {{ helpText.form.disabledWarningText }}
            </template>
            <template #cta>
              <KExternalLink
                class="empty-state-link"
                :href="docsLink"
              >
                {{ helpText.general.externalLinkText }}
              </KExternalLink>
            </template>
          </KEmptyState>
        </div>
      </template> -->
      </PluginEntityForm>

      <template #form-actions>
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
          appearance="primary"
          data-testid="form-submit"
          :disabled="!canSubmit"
          type="submit"
          @click="saveFormData"
        >
          {{ t('actions.save') }}
        </KButton>
      </template>
    </EntityBaseForm>

    <KEmptyState v-if="isDisabled && !schemaLoading">
      <template #title>
        {{ t('plugins.form.disabled_warning') }}
      </template>
      <!-- <template #cta>
        <KExternalLink
          class="empty-state-link"
          :href="docsLink"
        >
          {{ helpText.general.externalLinkText }}
        </KExternalLink>
      </template> -->
    </KEmptyState>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onBeforeMount, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import { marked, type MarkedOptions } from 'marked'
import { useAxios, useErrors, useStringHelpers, EntityBaseForm, EntityBaseFormType } from '@kong-ui-public/entities-shared'
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
} from '../types'
import endpoints from '../plugins-endpoints'
import composables from '../composables'
import { ArrayStringFieldSchema } from '../composables/plugin-schemas/ArrayStringFieldSchema'
import PluginEntityForm from './PluginEntityForm.vue'

// TODO: do I need it?
const formatPluginFieldLabel = (label: string) => {
  return capitalize(label.replace(/_/g, ' '))
}

const emit = defineEmits<{
  (e: 'update', data: Record<string, any>): void,
  (e: 'error', error: AxiosError): void,
  (e: 'fetch-schema:error', error: AxiosError): void,
  (e: 'loading', isLoading: boolean): void,
  (e: 'model-updated',
    payload: {
      model: Record<string, any>,
      data: Record<string, any>,
      resourceEndpoint: string
    }
  ): void,
}>()

// TODO: do we need any of these?
// emits: ['clicked-submit', 'enable-save', 'model-updated'],

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
      if (!config.cancelRoute || !config.backRoute) return false
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

  hideForeign: {
    type: Boolean,
    default: false,
  },

  // TODO: do we need?
  useKonnectSchema: {
    type: Boolean,
    default: true,
  },

  // TODO: can we make a sub component instead?
  isWizardStep: {
    type: Boolean,
    default: false,
  },

  // TODO: what's this?
  pluginData: {
    type: Object,
    default: null,
  },

  // TODO: do I need?
  // Yes, I think Konnect has it right, use this
  // instead of props for each individual entity's id
  entityData: {
    type: Object,
    default: null,
  },
  // TODO: do I need?
  warningMessage: {
    type: String,
    default: null,
  },
  // TODO: FF
  useCustomNamesForPlugin: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const { i18n: { t } } = composables.useI18n()
const { pluginMetaData } = composables.usePluginMetaData()
const { customSchemas, typedefs } = composables.useSchemas()
const { getMessageFromError } = useErrors()
const { capitalize } = useStringHelpers()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)
const formType = computed((): EntityBaseFormType => props.pluginId ? EntityBaseFormType.Edit : EntityBaseFormType.Create)
const schema = ref<Record<string, any> | null>(null)

// TODO: something better for fields
const form = reactive<PluginFormState>({
  fields: {},
  isReadonly: false,
  errorMessage: '',
})

// TODO: set defaults?
const formFieldsOriginal = reactive<PluginFormFields>({})

// TODO: is there a way to use this approach instead of hideForeign?
// or maybe just base it off of entityId existence?
/* const isKeySetFieldReadonly = computed<boolean>(() => {
  return form.isReadonly || (formType.value === EntityBaseFormType.Create && !!props.fixedKeySetId)
}) */

const isDisabled = computed((): boolean => {
  const currentPlugin = Object.keys(customSchemas).find((key: string) => key === props.pluginType)

  return currentPlugin ? (customSchemas[currentPlugin as keyof typeof customSchemas] as Record<string, any>)?.configurationDisabled : false
})

// TODO: I think some of this is duplicated, I recognize that protocols def
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
    type: props.hideForeign ? 'foreign' : 'selectionGroup',
    // TODO: ??
    // inputType: 'hidden',
    styleClasses: 'bottom-border hide-label',
    fields: [
      {
        label: t('plugins.form.scoping.global.label'),
        description: t('plugins.form.scoping.global.help'),
        // fields: null,
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
    // TODO: required: true, // konnect has true?
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

// TODO: do I need this?
/* const fields = computed((): Record<string, any> => {
  const fieldObj: Record<string, any> = {}

  if (props.config.entityType && props.config.entityId) {
    fieldObj[props.config.entityType] = props.config.entityId
  }

  return fieldObj
}) */

const entity = computed((): PluginScope => {
  // TODO: do I need this?
  if (props.entityData) {
    return props.entityData.entityType as PluginScope
  }

  const consumerId = (props.config.entityType === 'consumers' && props.config.entityId) || form.fields['consumer-id'] || record.value?.consumer?.id
  const consumerGroupId = (props.config.entityType === 'consumer_groups' && props.config.entityId) || form.fields['consumer_group-id'] || record.value?.consumer_group?.id
  const serviceId = (props.config.entityType === 'services' && props.config.entityId) || form.fields['service-id'] || record.value?.service?.id
  const routeId = (props.config.entityType === 'routes' && props.config.entityId) || form.fields['route-id'] || record.value?.route?.id

  if (consumerId) {
    return PluginScope.CONSUMER
  } if (consumerGroupId) {
    return PluginScope.CONSUMER_GROUP
  } else if (routeId) {
    return PluginScope.ROUTE
  } else if (serviceId) {
    return PluginScope.SERVICE
  }

  return PluginScope.GLOBAL
})

const resourceEndpoint = computed((): string => {
  let entityPath: EntityType = 'plugins'

  if (!props.config.entityId || entity.value === 'global') {
    return `${entityPath}`
  }

  if (entity.value === PluginScope.CONSUMER) {
    entityPath = 'consumers'
  } else if (entity.value === PluginScope.CONSUMER_GROUP) {
    entityPath = 'consumer_groups'
  } else if (entity.value === PluginScope.ROUTE) {
    entityPath = 'routes'
  } else if (entity.value === PluginScope.SERVICE) {
    entityPath = 'services'
  }

  return `${entityPath}/${props.config.entityId}/plugins`
})

const getArrayType = (list: unknown[]): string => {
  const uniqueTypes = [...(new Set(list.map(item => typeof item)))]

  return uniqueTypes.length > 1 ? 'string' : uniqueTypes[0]
}

// TODO: clean it up!
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
        // TODO: ask Yi about this
        // this is a new dependency
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

    if (scheme.required) {
      initialFormSchema[field].required = true
      initialFormSchema[field].selectOptions = {
        hideNoneSelectedText: true,
      }
    }

    // Default is set and is not an object or string 'function'
    if (scheme.default != null && typeof scheme.default !== 'object' && scheme.default !== 'function') {
      initialFormSchema[field].default = scheme.default
    }

    // Custom schema override
    if (pluginSchema && !pluginSchema.overwriteDefault && (customSchemas[props.pluginType as keyof typeof customSchemas].useKonnectSchema ? props.useKonnectSchema : true)) {
      Object.keys(pluginSchema).forEach(plugin => {
        // Check if current plugin matches any of custom schema keys
        if (plugin === field) {
          // Use custom defined schema instead of building from default && set field label
          const { help, label } = initialFormSchema[field]

          initialFormSchema[field] = { ...(pluginSchema[plugin as keyof typeof pluginSchema] as Record<string, any>), help, label }
        }
      })
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
      ...supportConsumerGroupScope ? ['consumer group'] : [],
    ]

    // TODO: translate and concat correctly
    const trailingEntities = scopeEntities.splice(scopeEntities.length - 2, 2).map((entityType: string) => entityType === 'service' ? t('plugins.form.scoping.gateway_service.plural') : t(`plugins.form.scoping.${entityType}.plural` as keyof typeof t))
    const trailingText = trailingEntities.join(`${scopeEntities.length > 0 ? ',' : ''} and/or `)

    // TODO: correct string concat
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

  if (customSchemas[props.pluginType as keyof typeof customSchemas] && customSchemas[props.pluginType as keyof typeof customSchemas].overwriteDefault && (customSchemas[props.pluginType as keyof typeof customSchemas].useKonnectSchema ? props.useKonnectSchema : true)) {
    if (Object.hasOwnProperty.call(customSchemas[props.pluginType as keyof typeof customSchemas], 'formSchema')) {
      Object.assign(defaultFormSchema, customSchemas[props.pluginType as keyof typeof customSchemas].formSchema)
    }
  }
}

/**
 * Is the form submit button enabled?
 * If the form.fields and formFieldsOriginal are equal, always return false
 */
// TODO: think about this
const canSubmit = computed((): boolean => JSON.stringify(form.fields) !== JSON.stringify(formFieldsOriginal))

// TODO: is this right?
const record = ref<Record<string, any> | null>(null)
const initForm = (data: Record<string, any>): void => {
  /* form.fields.name = data?.name || ''
  form.fields.tags = data?.tags?.join(', ') || '' */
  // TODO:
  form.fields.id = data?.id || undefined

  // Set initial state of `formFieldsOriginal` to these values in order to detect changes
  Object.assign(formFieldsOriginal, form.fields)

  // no init here, just set the record and it will be populated in PluginEntityForm
  record.value = data
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
const submitUrl = computed<string>(() => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app][formType.value]}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // Always replace the id when editing
  url = url.replace(/{id}/gi, props.pluginId)

  return url
})

const saveFormData = async (): Promise<void> => {
  try {
    form.isReadonly = true

    const requestBody: Record<string, any> = submitPayload.value

    let response: AxiosResponse | undefined

    await axiosInstance.post(validateSubmitUrl.value, requestBody)

    if (formType.value === 'create') {
      response = await axiosInstance.post(submitUrl.value, requestBody)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        // Note: Konnect currently uses PUT because PATCH is not fully supported in Koko
        //       If this changes, the `edit` form methods should be re-evaluated/updated accordingly
        ? await axiosInstance.put(submitUrl.value, requestBody)
        : await axiosInstance.patch(submitUrl.value, requestBody)
    }

    // if (response) {
    //   const { data } = response
    // TODO:
    // form.fields.entity_id = response?.data?.certificate?.id || ''

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
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].pluginSchema}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // replace the plugin type
  url = url.replace(/{plugin}/gi, props.pluginType)

  return url
})

const schemaLoading = ref(false)
const fetchSchemaError = ref('')
onBeforeMount(async () => { // TODO: confirm when the GET by ID happens in EntityFormBase, how do I set record?
  schemaLoading.value = true

  try {
    const response = await axiosInstance.get(schemaUrl.value)
    const { data } = response

    if (data) {
      // start from the config part of the schema
      const configField = data.fields.find((field: Record<string, any>) => field.config)
      const configResponse = configField ? configField.config : response

      initScopeFields()

      const protocolsField = data.fields.find((field: Record<string, any>) => field.protocols)?.protocols

      if (protocolsField) {
        const { default: defaultValues = [], elements = {} } = protocolsField

        defaultFormSchema.protocols.default = defaultValues

        if (elements.one_of?.length) {
          defaultFormSchema.protocols.values = elements.one_of.map((value: string) => ({ label: value, value }))
        }
      }

      schema.value = buildFormSchema('config', configResponse, defaultFormSchema)
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
}
</style>

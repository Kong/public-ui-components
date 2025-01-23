<template>
  <div class="kong-ui-entities-plugin-form">
    <KSkeleton
      v-if="loading"
      type="form"
    />

    <div
      v-else
      class="entity-form"
    >
      <component
        :is="sharedFormName"
        v-if="sharedFormName && (formModel.id && editing || !editing)"
        :form-model="formModel"
        :form-options="formOptions"
        :form-schema="formSchema"
        :is-editing="editing"
        :on-model-updated="onModelUpdated"
        :on-partial-toggled="onPartialToggled"
        :show-new-partial-modal="() => $emit('showNewPartialModal')"
      >
        <template
          v-if="enableVaultSecretPicker"
          #[AUTOFILL_SLOT_NAME]="slotProps: AutofillSlotProps"
        >
          <VaultSecretPickerProvider
            v-if="slotProps.schema.referenceable"
            v-bind="slotProps"
            @open="(value, update) => setUpVaultSecretPicker(value, update)"
          />
        </template>
      </component>

      <VueFormGenerator
        v-if="!sharedFormName && (formModel.id && editing || !editing)"
        :enable-redis-partial="props.enableRedisPartial"
        :model="formModel"
        :options="formOptions"
        :schema="formSchema"
        @model-updated="onModelUpdated"
        @partial-toggled="onPartialToggled"
        @refresh-model="getModel"
        @show-new-partial-modal="$emit('showNewPartialModal')"
      >
        <template #plugin-config-empty-state>
          <div class="plugin-config-empty-state">
            {{ t('plugins.form.grouping.plugin_configuration.empty') }}
          </div>
        </template>

        <!-- For the opentelemetry plugin, we only need to show rule alerts with its new schema -->
        <template
          v-if="PLUGIN_METADATA[formModel.name]?.fieldRules && (props.config.isNewOtelSchema || formModel.name !== 'opentelemetry')"
          #plugin-config-before-content
        >
          <PluginFieldRuleAlerts :rules="PLUGIN_METADATA[formModel.name].fieldRules!" />
        </template>

        <template
          v-if="enableVaultSecretPicker"
          #[AUTOFILL_SLOT_NAME]="slotProps: AutofillSlotProps"
        >
          <VaultSecretPickerProvider
            v-if="slotProps.schema.referenceable"
            v-bind="slotProps"
            @open="(value, update) => setUpVaultSecretPicker(value, update)"
          />
        </template>
      </VueFormGenerator>
    </div>
  </div>

  <VaultSecretPicker
    :config="props.config"
    :setup="vaultSecretPickerSetup"
    @cancel="() => vaultSecretPickerSetup = false"
    @proceed="handleVaultSecretPickerAutofill"
  />
</template>

<script lang="ts">
import {
  VaultSecretPicker,
  VaultSecretPickerProvider,
} from '@kong-ui-public/entities-vaults'
import '@kong-ui-public/entities-vaults/dist/style.css'
import { useAxios, useHelpers } from '@kong-ui-public/entities-shared'
import {
  AUTOFILL_SLOT_NAME,
  FORMS_API_KEY,
  FORMS_CONFIG,
  customFields,
  getSharedFormName,
  sharedForms,
  type AutofillSlotProps,
} from '@kong-ui-public/forms'
import '@kong-ui-public/forms/dist/style.css'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { computed, defineComponent, onBeforeMount, provide, reactive, ref, watch, type PropType } from 'vue'
import composables from '../composables'
import useI18n from '../composables/useI18n'
import { PLUGIN_METADATA } from '../definitions/metadata'
import endpoints from '../plugins-endpoints'
import {
  type KongManagerPluginFormConfig,
  type KonnectPluginFormConfig,
  type PluginEntityInfo,
} from '../types'
import PluginFieldRuleAlerts from './PluginFieldRuleAlerts.vue'

// Must explicitly specify these as components since they are rendered dynamically
export default defineComponent({
  components: { ...sharedForms },
})
</script>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void,
  (e: 'model-updated',
    payload: {
      model: Record<string, any>,
      originalModel: Record<string, any>,
      data: Record<string, any>
    }
  ): void,
  (e: 'showNewPartialModal'): void,
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>,
    required: true,
    validator: (config: KonnectPluginFormConfig | KongManagerPluginFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      return true
    },
  },
  /**
   * Entity data if plugin is scoped
   */
  entityMap: {
    type: Object as PropType<Record<string, PluginEntityInfo>>,
    default: () => ({}),
  },
  /**
   * Plugin data if being edited
   */
  record: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  /**
   * Form schema
   */
  schema: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  /**
   * Whether or not the form is in edit mode
   */
  editing: {
    type: Boolean,
    default: false,
  },
  /**
   * Plugin credential form
   */
  credential: {
    type: Boolean,
    default: false,
  },
  /**
   * Control if the vault secret picker is enabled for applicable fields. (referenceable = true)
   */
  enableVaultSecretPicker: {
    type: Boolean,
    default: false,
  },
  /**
   * Control if the redis partial is enabled for plugins.
   */
  enableRedisPartial: {
    type: Boolean,
    default: false,
  },
})

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const { parseSchema } = composables.useSchemas({
  entityId: props.entityMap.focusedEntity?.id || undefined,
  credential: props.credential,
  enableRedisPartial: props.enableRedisPartial,
})
const { convertToDotNotation, unFlattenObject, dismissField, isObjectEmpty, unsetNullForeignKey } = composables.usePluginHelpers()

const { objectsAreEqual } = useHelpers()
const { i18n: { t } } = useI18n()

// define endpoints for use by KFG
const buildGetOneUrl = (entityType: string, entityId: string): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].entityGetOne}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  // replace the entity type and id
  url = url.replace(/{entity}/gi, entityType)
  url = url.replace(/{id}/gi, entityId)

  return url
}
// define endpoints for use by KFG
const buildGetAllUrl = (entityType: string): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].entityGetAll}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
  }

  // replace the entity type
  url = url.replace(/{entity}/gi, entityType)

  return url
}

/**
 * @param {entityType} string - the entity query path WITHOUT leading/trailing slash (ex. 'routes')
 * @param {entityId} string - the id of the entity to look up
 * @returns {Promise<import('axios').AxiosResponse<T>>}
 */
const getOne = (entityType: string, entityId: string): Promise<AxiosResponse> => {
  const url = buildGetOneUrl(entityType, entityId)

  return axiosInstance.get(url)
}

/**
 * @param {entityType} string - the entity query path WITHOUT leading/trailing slash (ex. 'routes')
 * @returns {Promise<import('axios').AxiosResponse<T>>}
 */
const getAll = (entityType: string, params: AxiosRequestConfig['params']): Promise<AxiosResponse> => {
  const url = buildGetAllUrl(entityType)

  // Currently hardcoded to fetch 1000 records, and filter
  // client side. If more than 1000 records, this won't work
  if (props.config.app === 'konnect') {
    return axiosInstance.get(url).then(res => {
      const { data: { data } } = res

      delete params.size
      delete params.offset

      if (data.length && Object.keys(params).length === 1) {
        const queryKey = Object.keys(params)[0]
        const filteredData = data.filter((instance: Record<string, any>) => {
          if (instance[queryKey]) {
            return !!instance[queryKey].toLowerCase().includes(params[queryKey].toLowerCase())
          }

          return false
        })

        res.data.data = filteredData
      }

      return res
    })
  }

  return axiosInstance.get(url, { params })
}

// provide to KFG
provide(FORMS_API_KEY, {
  getOne,
  getAll,
})

provide(FORMS_CONFIG, props.config)

const sharedFormName = ref('')
const form = ref<Record<string, any> | null>(null)
const formSchema = ref<Record<string, any>>({})
const originalModel = reactive<Record<string, any>>({})
const formModel = reactive<Record<string, any>>({})
const formOptions = computed(() => form.value?.options)

const vaultSecretPickerSetup = ref<string | false>(false)
const vaultSecretPickerAutofillAction = ref<(secretRef: string) => void | undefined>()
const setUpVaultSecretPicker = (setupValue: string, autofillAction: (secretRef: string) => void) => {
  vaultSecretPickerSetup.value = setupValue ?? ''
  vaultSecretPickerAutofillAction.value = autofillAction
}
const handleVaultSecretPickerAutofill = (secretRef: string) => {
  vaultSecretPickerAutofillAction.value?.(secretRef)
  vaultSecretPickerSetup.value = false
}

// This function transforms the form data into the correct structure to be submitted to the API
const getModel = (): Record<string, any> => {
  const schema = { ...props.schema }
  const inputModel = formModel
  const origModel = originalModel
  const formModelFields = Object.keys(inputModel)
  const outputModel: Record<string, any> = {}

  if (!isObjectEmpty(formSchema.value)) {
    // convert formSchema from array to object
    for (let i = 0; i < formSchema.value?.fields?.length; i++) {
      schema[formSchema.value.fields[i].model] = formSchema.value.fields[i]
    }
  }

  // Moved custom field keys to top level of schema & remove key
  customFields.forEach((customField: string) => {
    if (schema[customField]) {
      schema[customField].fields.forEach((field: Record<string, any>) => {
        // if the field has a fields array, set each to top level.
        // Check out buildCustomFields() in EntityMixin for similar logic
        if (field.fields) {
          field.fields.forEach((subField: Record<string, any>) => {
            schema[subField.model] = subField
          })
        }

        if (field.model) schema[field.model] = field
      })
      delete schema[customField]
    }
  })

  // Iterate over each field in the form, transform each field value to match the
  // Kong Admin APIs request expectations for submission
  formModelFields.forEach(fieldName => {
    if (!schema[fieldName]) {
      // special handling for partials
      if (fieldName === 'partials') {
        outputModel[fieldName] = inputModel[fieldName]
      }
      return
    }

    const fieldSchema = schema[fieldName]
    let fieldValue = inputModel[fieldName]
    const originalValue = origModel[fieldName]
    const fieldValueType = Array.isArray(fieldValue) ? 'array' : typeof fieldValue
    const fieldSchemaValueType = fieldSchema ? fieldSchema.valueType : null
    const fieldSchemaArrayValueType = fieldSchema ? fieldSchema.valueArrayType : null
    const transformer = fieldSchema ? fieldSchema.transform : null

    if (fieldValue == null && originalValue == null && !fieldSchema.submitWhenNull) {
      return
    }

    if (fieldSchema) {
      // Check whether field has a value type and do conversions when required
      // `.valueType` property values are defined in `pages/Plugins/Form.vue`
      if (fieldSchemaValueType && fieldValueType !== fieldSchemaValueType) {
        switch (fieldSchemaValueType) {
          case 'array':
            if (fieldValueType === 'string' && fieldValue.length) {
              fieldValue = fieldValue.split(',').map((value: any) => {
                value = value.trim()

                if (fieldSchemaArrayValueType === 'string') {
                  return String(value)
                }

                if (fieldSchemaArrayValueType === 'number') {
                  return Number(value)
                }

                if (fieldSchemaArrayValueType === 'boolean') {
                  // Convert string based boolean values ('true', 'false') to boolean type
                  if (typeof value === 'string') {
                    return (value.toLowerCase() === 'true' || value === '1')
                  }

                  // Handle a numerical value, just in-case someone fudged an input type.
                  if (typeof value === 'number') {
                    return (value === 1)
                  }
                }

                return value
              })
            }

            // We only want to set array fields to empty if the field is empty
            if ((!fieldValue || !fieldValue.length)) {
              fieldValue = fieldSchema.submitWhenNull ? null : []
            }

            break

          case 'number':
            // Use `Number()` to properly convert a string representation to it's
            // proper sub-type (integer, float)
            fieldValue = Number(fieldValue)
            break

          case 'boolean':
            // Convert string based boolean values ('true', 'false') to boolean type
            if (fieldValueType === 'string') {
              fieldValue = (fieldValue.toLowerCase() === 'true' || fieldValue === '1')
            }

            // Handle a numerical value, just in-case someone fudged an input type.
            if (fieldValueType === 'number') {
              fieldValue = (fieldValue === 1)
            }

            break

          // Handle values that aren't strings but should be.
          case 'string':
            fieldValue = (fieldValue == null) ? '' : String(fieldValue)
            break
        }
      } else if (fieldSchemaValueType === 'array') {
        if ((!fieldValue || !fieldValue.length)) {
          fieldValue = fieldSchema.submitWhenNull ? null : []
        } else if (fieldSchema.inputAttributes?.type === 'number') {
          fieldValue = fieldValue.map((value: string) => Number(value))
        }
      }

      // FIXME: Special treatment for AI plugins with complexly nested array fields
      if (fieldSchema.type === 'array' && fieldSchema.nestedFields) {
        const deepOmitNil = (o: Record<string, any>) => {
          Object.keys(o).forEach(key => {
            if (o[key] && typeof o[key] === 'object' && o[key] !== null) {
              deepOmitNil(o[key])
            } else if (o[key] === undefined || o[key] === null || (typeof o[key] === 'number' && isNaN(o[key]))
              || (typeof o[key] === 'string' && o[key].trim().length === 0)) {
              delete o[key]
            }
          })
        }
        if (fieldValue && typeof fieldValue === 'object') {
          deepOmitNil(fieldValue)
        }
      }

      // Format Advanced Object for submission
      if (fieldSchema.type === 'object-advanced' && fieldSchema.fields && fieldValue !== null) {
        if (Object.entries(fieldValue).length === 0) {
          fieldValue = null
        } else {
          Object.keys(fieldValue).forEach(key => {
            if (Array.isArray(fieldValue[key])) return

            fieldValue[key] = fieldValue[key].split(',')
          })
        }
      }
    }

    // Converts the field name from dasherized notation that HTML & Vue understand
    // to the dot notation that the Kong Admin API understands.
    let fieldNameDotNotation = convertToDotNotation(fieldName)

    // If the field name originally has dashes, they were converted to underscores during initiation.
    // Now we need to convert them back to dashes because the Admin API expects dashes
    if (fieldSchema.fieldNameHasDashes) {
      const [keyToBeConverted, ...rest] = fieldNameDotNotation.split('.').reverse()

      fieldNameDotNotation = [keyToBeConverted.replace(/_/g, '-'), ...rest].reverse().join('.')
    }

    if (fieldSchemaValueType === 'object-expand') {
      let key

      [fieldNameDotNotation, key] = fieldNameDotNotation.split('.')

      let fieldObject: Record<string, any> = {}

      // Rather then over writting the key in output model we, use the existing object if there is one
      // this allows us to do things like support multiple developer meta fields
      if (outputModel[fieldNameDotNotation]) {
        fieldObject = outputModel[fieldNameDotNotation]
      }

      fieldObject[key] = fieldValue
      fieldValue = fieldObject
    }

    // Empty fields are set to null to tell Kong to remove the value
    // or reset this value to it's default.

    // Include if field is empty & field has been modified from orginal value
    if (originalValue !== undefined && fieldValue === '' && fieldValue !== originalValue) {
      // We need to determine what type of 'empty' value to set for modified nested inputs,
      // if we do not the model will not preserve its structure
      // (this change may be able to be removed when core updates its reset default handling)
      outputModel[fieldNameDotNotation] = fieldSchemaValueType === 'object' ? {} : null

      // If empty & field is a checklist array, set as [] to prevent all options being selected
    } else if (fieldSchema.type === 'checklist' && fieldValue === '') {
      outputModel[fieldNameDotNotation] = []

      // Include input value if field is not empty
    } else if (fieldValue !== '') {
      outputModel[fieldNameDotNotation] = fieldValue
    }

    // Do an optional final transform, as defined in transform() function in schema field
    outputModel[fieldNameDotNotation] = transformer
      ? transformer(fieldValue)
      : outputModel[fieldNameDotNotation]

    // If dot notated key (service.id) is null, set the whole object to null (service = null)
    unsetNullForeignKey(fieldNameDotNotation, outputModel)
  })

  return unFlattenObject(outputModel)
}

const onPartialToggled = (dismissSchemaField: string | undefined, additionalModel: Record<string, any> = {}) => {
  dismissField(formModel, additionalModel, dismissSchemaField)
  emit('model-updated', {
    model: formModel,
    originalModel,
    data: getModel(),
  })
}

// fired whenever the form data is modified
const onModelUpdated = (model: any, schema: string) => {
  const newData = { [schema]: model }
  if (typeof props.schema[schema]?.modelTransformer === 'function') {
    newData[schema] = props.schema[schema].modelTransformer(model)
  }
  const newModel = Object.assign({}, formModel, newData)

  Object.assign(formModel, newModel)
  emit('model-updated', {
    model: formModel,
    originalModel,
    data: getModel(),
  })
}

// special handling for problematic fields before we emit
const updateModel = (data: Record<string, any>, parent?: string) => {
  Object.keys(data).forEach(key => {
    let modelKey = parent ? `${parent}-${key}` : key
    let scheme = props.schema[modelKey]

    // If `scheme` is undefined, it is because
    // 1. the key is not the deepest nested key of the schema object
    // 2. or the field name has dashes in it and its schema key was converted to underscores during initiation
    // 3. or `parent` is already a schema key and `key` is a nested key of its value object
    // For reasons 2 and 3, we need special logic to find the correct schema key
    if (!scheme) {
      const underscoredModelKey = parent ? `${parent}-${key.replace(/-/g, '_')}` : key.replace(/-/g, '_')

      // Here we check if the underscored key exists in the schema and the `fieldNameHasDashes` flag is true
      if (props.schema[underscoredModelKey]?.fieldNameHasDashes) {
        modelKey = underscoredModelKey
        scheme = props.schema[modelKey]
      }

      // Here we check if `parent` is a schema key and `key` is a nested key of its value object
      if (parent && props.schema[parent]?.keyFromObject === key) {
        modelKey = parent
        scheme = props.schema[modelKey]
      }
    }

    const value = data[key]
    const type = typeof value

    // Ensure Object Advanced field is saved to model as empty object
    if (scheme && scheme.type === 'object-advanced' && !value) {
      formModel[modelKey] = {}
      originalModel[modelKey] = {}

      return
    }

    // avoid pass by ref
    if (Array.isArray(value)) {
      formModel[modelKey] = JSON.parse(JSON.stringify(value))
      originalModel[modelKey] = JSON.parse(JSON.stringify(value))

      return
    }

    // update the model for each child of the object
    if (type === 'object' && value && !value.length) {
      return updateModel(value, modelKey)
    }

    // treatment for arrays, convert to comma separated string
    if (type === 'object' && value && value.length && scheme.type === 'input') {
      formModel[modelKey] = value.join(', ')
      originalModel[modelKey] = value.join(', ')

      return
    }

    formModel[modelKey] = value
    originalModel[modelKey] = value
  })

  emit('model-updated', {
    model: formModel,
    originalModel,
    data: getModel(),
  })
}

const loading = ref(true)
const initFormModel = (): void => {
  if (props.record && props.schema) {
    // global fields
    updateModel({
      enabled: props.record.enabled ?? true,
      ...(props.record.instance_name && { instance_name: props.record.instance_name || '' }),
      ...(props.record.protocols && { protocols: props.record.protocols }),
      ...(props.record.tags && { tags: props.record.tags }),
    })

    // handle credentials
    if (props.credential) {
      // scope
      if (props.record.consumer_id || props.record.consumer) {
        updateModel({
          consumer_id: props.record.consumer_id || props.record.consumer,
        })
      }

      updateModel(props.record)
    } else if (props.record.config) { // typical plugins
      // scope fields
      if ((props.record.consumer_id || props.record.consumer) || (props.record.service_id || props.record.service) ||
        (props.record.route_id || props.record.route) || (props.record.consumer_group_id || props.record.consumer_group)) {
        updateModel({
          service_id: props.record.service_id || props.record.service,
          route_id: props.record.route_id || props.record.route,
          consumer_id: props.record.consumer_id || props.record.consumer,
          consumer_group_id: props.record.consumer_group_id || props.record.consumer_group,
        })
      }

      // handle partials and provide to formRedis component
      if (props.record.partials) {
        onPartialToggled('redis', { partials: props.record.partials })
      }

      // main plugin configuration
      updateModel(props.record.config, 'config')
    }
  }

  // scoping logic, convert _ to - for form model
  // Check if incoming field exists in current model and if so update
  if (Object.keys(props.entityMap).length && !props.entityMap.global && props.schema) {
    const updateFields: Record<string, any> = {}
    for (const entity in props.entityMap) {
      const id = props.entityMap[entity].id
      const idField = props.entityMap[entity].idField
      const key = idField === 'consumer_group_id' ? 'consumer_group-id' : JSON.parse(JSON.stringify(idField).replace('_', '-'))

      // ex. set consumer-id: <entityId>
      if (Object.prototype.hasOwnProperty.call(formModel, key)) {
        updateFields[key] = id
      }
    }

    updateModel(updateFields)
  }

  // credentials don't recognize field with -id, so for now set it like
  // ex. consumer: <entityId>
  // we'll fix this on submit
  if (props.entityMap.consumer?.id && props.schema && props.credential) {
    const updateFields: Record<string, any> = {}
    if (Object.prototype.hasOwnProperty.call(formModel, 'consumer')) {
      updateFields.consumer = props.entityMap.consumer.id
    }

    updateModel(updateFields)
  }

  loading.value = false
}

watch(loading, (newLoading) => {
  emit('loading', newLoading)
})

// if the schema changed we've got to start over and completely rebuild the form model
watch(() => props.schema, (newSchema, oldSchema) => {
  if (objectsAreEqual(newSchema || {}, oldSchema || {})) {
    return
  }
  const form: Record<string, any> = parseSchema(newSchema)

  Object.assign(formModel, form.model)

  formSchema.value = {
    fields: formSchema.value?.fields?.map((r: Record<string, any>) => {
      return { ...r, disabled: r.disabled || false }
    }),
  }
  Object.assign(originalModel, JSON.parse(JSON.stringify(form.model)))
  sharedFormName.value = getSharedFormName(form.model.name)

  initFormModel()
}, { immediate: true, deep: true })

onBeforeMount(() => {
  form.value = parseSchema(props.schema)

  Object.assign(formModel, form.value?.model || {})
  formSchema.value = form.value?.schema || {}

  initFormModel()
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-form {
  width: 100%;

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .entity-form {
    .plugin-config-empty-state {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-30;
      font-style: italic;
      margin-bottom: $kui-space-60;
    }
  }

  :deep(.vue-form-generator) {
    >fieldset {
      .form-group:last-child {
        margin-bottom: 0;
      }
    }

    .k-collapse.root-level-collapse {
      border-top: $kui-border-width-10 solid $kui-color-border;
      margin-top: $kui-space-80;
      padding-top: $kui-space-80;
    }

    fieldset {
      border: none;
      padding: $kui-space-0;
    }

    .bottom-border {
      border-bottom: $kui-border-width-10 solid $kui-color-border;
      padding-bottom: $kui-space-80;
    }

    .top-border {
      border-top: $kui-border-width-10 solid $kui-color-border;
      padding-top: $kui-space-80;
    }

    .form-group.kong-form-hidden-field-wrapper {
      display: none;
    }

    .form-group hr.divider {
      border-color: $kui-color-border;
      opacity: .3;
    }

    .form-group hr.wide-divider {
      border-color: $kui-color-border;
      opacity: .6;
    }

    .form-group.field-textArea textarea {
      resize: vertical;
    }

    .hint {
      font-size: $kui-font-size-20;
      margin-bottom: 10px;
      margin-top: 5px;
      opacity: 0.6;
    }

    .k-select-item button,
    .k-multiselect-item button {
      border: none;

      .k-select-item-label .first-part,
      .k-multiselect-item-label {
        display: block;
        text-align: start;
      }
    }

    .field-radios .radio-list label input[type=radio] {
      margin-right: 10px;
    }

    label {
      font-weight: $kui-font-weight-medium;
    }

    .form-group.field-array label,
    .form-group.field-select label,
    .form-group.field-multiselect label {
      display: flex;
      justify-content: flex-start;
    }

    .kong-form-array-field {
      width: 100%;

      .kong-form-array-field-item {
        margin-bottom: $kui-space-40;

        .k-button.delete {
          align-self: center;
        }
      }
    }
  }

  .global-fields {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
  }

  .general-settings {
    .form-group label {
      display: flex;
      justify-content: flex-start;
    }

    .form-group .field-wrap button {
      margin-top: $kui-space-30;
    }

    .link-wrapper {
      margin-top: $kui-space-60;
    }
  }
}
</style>

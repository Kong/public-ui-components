<template>
  <div class="kong-ui-entities-plugin-form">
    <!-- Having a hidden form here allows us to @submit like a native html form -->
    <!--
      <form
        hidden
        @submit="confirm"
      />
    -->

    <!-- TODO: do I need? -->
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
        v-if="sharedFormName && (formModel.id && isEditing || !isEditing)"
        :form-model="formModel"
        :form-options="formOptions"
        :form-schema="formSchema"
        :is-editing="isEditing"
        :on-model-updated="onModelUpdated"
      />

      <VueFormGenerator
        v-if="!sharedFormName && (formModel.id && isEditing || !isEditing)"
        :model="formModel"
        :options="formOptions"
        :schema="formSchema"
        @model-updated="onModelUpdated"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ref, reactive, provide, watch, type PropType, onBeforeMount, defineComponent } from 'vue'
import type { AxiosResponse, AxiosRequestConfig } from 'axios'
import {
  EntityTypeIdField,
  type KonnectPluginFormConfig,
  type KongManagerPluginFormConfig,
} from '../types'
import { useHelpers, useAxios } from '@kong-ui-public/entities-shared'
import {
  customFields,
  getSharedFormName,
  FORMS_API_KEY,
  sharedForms,
} from '@kong-ui-public/forms'
import '@kong-ui-public/forms/dist/style.css'
import composables from '../composables'
import endpoints from '../plugins-endpoints'

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
      if (!config.cancelRoute || !config.backRoute) return false
      return true
    },
  },
  /**
   * Plugin data if being edited
   */
  record: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  schema: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const { objectsAreEqual } = useHelpers()
const { parseSchema } = composables.useSchemas(props.config.entityId)
const { convertToDotNotation, unFlattenObject, isObjectEmpty, unsetNullForeignKey } = composables.usePluginHelpers()

// define endpoints for use by KFG
const buildGetOneUrl = (entityType: string, entityId: string): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].entityGetOne}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  // replace the entity type and id
  url = url.replace(/{entity}/gi, entityType)
  url = url.replace(/{id}/gi, entityId)

  return url
}

const buildGetAllUrl = (entityType: string): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].entityGetAll}`

  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
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

  // TODO: currently hardcoded to fetch 1000 records, and filter
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

const sharedFormName = ref('')
const form = ref<Record<string, any> | null>(null)
const formSchema = ref<Record<string, any>>({})
const originalModel = reactive<Record<string, any>>({})
const formModel = reactive<Record<string, any>>({})
const formOptions = computed(() => form.value?.options)

const entityIdField = computed((): string => {
  switch (props.config.entityType) {
    case 'services':
      return EntityTypeIdField.SERVICE
    case 'routes':
      return EntityTypeIdField.ROUTE
    case 'consumers':
      return EntityTypeIdField.CONSUMER
    case 'consumer_groups':
      return EntityTypeIdField.CONSUMER_GROUP
    default:
      return ''
  }
})

const onModelUpdated = (model: Record<string, any>, schema: string) => {
  const newData = { [schema]: model }
  const newModel = Object.assign({}, formModel, newData)

  Object.assign(formModel, newModel)

  emit('model-updated', {
    model: formModel,
    originalModel,
    data: getModel(),
  })
}

const updateModel = (data: Record<string, any>, parent?: string) => {
  Object.keys(data).forEach(key => {
    let modelKey = parent ? `${parent}-${key}` : key
    let scheme = props.schema[modelKey]

    // If `scheme` is undefined, it is either because the key is not the deepest nested key of the schema object
    // or the field name has dashes in it and its schema key was converted to underscores during initiation.
    if (!scheme) {
      const underscoredModelKey = parent ? `${parent}-${key.replace(/-/g, '_')}` : key.replace(/-/g, '_')

      // Here we check if the underscored key exists in the schema and the `fieldNameHasDashes` flag is true
      if (props.schema[underscoredModelKey]?.fieldNameHasDashes) {
        modelKey = underscoredModelKey
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

    if (Array.isArray(value)) {
      formModel[modelKey] = JSON.parse(JSON.stringify(value))
      originalModel[modelKey] = JSON.parse(JSON.stringify(value))

      return
    }

    if (type === 'object' && value && !value.length) {
      return updateModel(value, modelKey)
    }

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

  // Iterate over each field, transform each field value to match the
  // Kong Admin APIs value expectations
  formModelFields.forEach(fieldName => {
    if (!schema[fieldName]) {
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

      const fieldObject: Record<string, any> = {}

      // TODO:
      // Rather then over writting the key in output model we, use the existing object if there is one
      // this allows us to do things like support multiple developer meta fields
      /* if (outputModel[fieldNameDotNotation]) {
        fieldObject = outputModel[fieldNameDotNotation]
      } */

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

// TODO: need it?
const loading = ref(true)
const initFormModel = (): void => {
  if (props.record && props.schema) {
    // top level fields
    updateModel({
      enabled: props.record.enabled ?? true,
      instance_name: props.record.instance_name || '',
      protocols: props.record.protocols || [],
      tags: props.record.tags || [],
    })

    if (props.record.data) {
      const newModel = props.record.data
      newModel.client_certificate = newModel.client_certificate?.id
      updateModel(props.record.data)
    } else if (props.record.config) {
      if (props.record.consumer_id || props.record.service_id || props.record.route_id || props.record.consumer_group_id) {
        updateModel({
          service_id: props.record.service_id,
          route_id: props.record.route_id,
          consumer_id: props.record.consumer_id,
          consumer_group_id: props.record.consumer_group_id,
          enabled: props.record.enabled,
        })
      }

      updateModel(props.record.config, 'config')
    }
  }

  // Check if incoming field exists in current model and add if so update
  if (entityIdField.value && props.schema) {
    const updateFields: Record<string, any> = {}
    const key = entityIdField.value === 'consumer_group_id' ? 'consumer_group-id' : JSON.stringify(JSON.parse(entityIdField.value)).replace('_', '-')

    if (Object.prototype.hasOwnProperty.call(formModel, key)) {
      updateFields[key] = props.config.entityId
    }

    updateModel(updateFields)
  }

  // TODO: do I need?
  // Check if referal query params field exists in current model and add if so update
  /* if (props.config.entityId && props.schema) {
    const updateFields = {}
    if (Object.prototype.hasOwnProperty.call(formModel, entityType)) {
      updateFields[entityType] = entityId.split(',')[0]
    }

    updateModel(updateFields)
  } */

  disabled.value = false
  loading.value = false
}

// TODO: how is this prop used??
const disabled = ref(false)
watch(formModel, (newModel) => {
  // TODO: is this logic right???
  formSchema.value = { fields: formSchema.value?.fields?.map((r: Record<string, any>) => { return { ...r, disabled: r.disabled || false } }) }
  const changesExist = !objectsAreEqual(newModel, originalModel)

  if (changesExist) {
    disabled.value = false
  } else if (!changesExist && props.isEditing) {
    disabled.value = true
  }
}, { deep: true })

watch(() => props.schema, (newSchema) => {
  const form: Record<string, any> = parseSchema(newSchema)

  Object.assign(formModel, form.model)

  // TODO: is this logic right???
  formSchema.value = { fields: formSchema.value?.fields?.map((r: Record<string, any>) => { return { ...r, disabled: r.disabled || false } }) }
  Object.assign(originalModel, JSON.parse(JSON.stringify(form.model)))
  sharedFormName.value = getSharedFormName(form.model.name)

  initFormModel()
}, { immediate: true })

onBeforeMount(() => {
  // TODO: am I calling in the right place?
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

  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
}
</style>

<style lang="scss">
.kong-ui-entities-plugin-form {
  .vue-form-generator {
    & > fieldset {
      border: none;
      padding: $kui-space-0;
    }

    .field-switch .field-wrap label {
      .label {
        background-color: $kui-color-background-neutral-weak;
      }
    }

    .bottom-border {
      border-bottom: $kui-border-width-10 solid $kui-color-border;
      padding-bottom: $kui-space-80;
    }

    .top-border {
      border-top: $kui-border-width-10 solid $kui-color-border;
      padding-top: $kui-space-80;
    }

    .form-group label {
      margin-bottom: $kui-space-40;
    }

    .form-group.field-checkbox .form-group-label {
      margin-bottom: $kui-space-0;
    }

    .hint {
      font-size: $kui-font-size-20;
      margin-bottom: 10px;
      margin-top: 5px;
      opacity: 0.6;
    }

    .k-select-item button {
      border: none;

      .k-select-item-label .first-part {
        display: block;
        text-align: start;
      }
    }

    .field-checkbox {
      align-items: center;
      display: flex;
    }

    .field-radios .radio-list label input[type=radio] {
      margin-right: 10px;
    }

    label {
      font-weight: $kui-font-weight-medium;
    }

    .form-group.field-array label,
    .form-group.field-input label {
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

    .k-checkbox {
       label {
        margin: $kui-space-0;
        order: 1
      }

      input {
        margin-left: $kui-space-0;
        margin-right: $kui-space-50;
      }
    }
  }
}
</style>

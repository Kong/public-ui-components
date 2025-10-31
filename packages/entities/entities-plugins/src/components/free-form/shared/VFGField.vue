⚠️⚠️⚠️
This is NOT a comprehensive wrapper of VFG!
We can't guarantee that fields of all types can be written correctly to FreeForm.
Please do not use this component unless you have confirmed with @Zehao Zhang.

Only tested with the following use cases:
- the `enable` field
- scope-related fields: `service`, `route`, `consumer`, `consumer_group`
- general info fields: `instance_name`, `tags`, `protocols`

<template>
  <VueFormGenerator
    :model="vfgModel"
    :options="formOptions"
    :schema="vfgSchema"
    @model-updated="handleVFGModelUpdate"
  />
</template>

<script setup lang="ts">
import { VueFormGenerator } from '@kong-ui-public/forms'
import { useFormShared } from './composables'
import { computed } from 'vue'

interface VFGFieldProps {
  formOptions?: Record<string, any>
  vfgSchema: {
    fields: Array<{
      model: string
      type: string
    }>
  }
}

const rawTagsStringSymbol = Symbol('rawTagsString')
const { vfgSchema } = defineProps<VFGFieldProps>()
const { formData, getSchema } = useFormShared<Record<string, any>>()

/**
 * Construct VFG model from formData.
 * ⚠️ Assume all fields are first-level fields, any nested fields are not supported here
 */
const vfgModel = computed(() => {
  const model: Record<string, any> = {}
  vfgSchema.fields.forEach((field) => {
    if (field.type === 'AutoSuggest') {
      // for foreign fields, we need to set the id of the referenced entity
      if (formData[field.model.split('-')[0]]) {
        model[field.model] = formData[field.model.split('-')[0]].id
      }
    } else if (field.model === 'tags' && formData[field.model]) {
      model[field.model] = formData[field.model][rawTagsStringSymbol] ?? formData[field.model].join(', ')
    } else {
      model[field.model] = formData[field.model]
    }
  })
  return model
})

/**
 * Handles VFG model updates and syncs them back to formData.
 * ⚠️ Assume this model is always the first-level field, any nested fields are not supported here
 */
function handleVFGModelUpdate(value: any, model: string) {
  const path = model.split('-')[0]
  const fieldSchema = getSchema(path)
  if (!fieldSchema) throw new Error(`Field schema not found for path: ${path}`)

  if (fieldSchema.type === 'foreign') {
    // for foreign fields, we need to set the referenced entity with id
    formData[path] = value ? { id: value } : null
  } else if (path === 'tags') {
    // for tags field, we need to store both the array and the raw string
    const arr = value.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    formData[path] = arr
    formData[path][rawTagsStringSymbol] = value
  } else {
    formData[path] = value
  }
}
</script>

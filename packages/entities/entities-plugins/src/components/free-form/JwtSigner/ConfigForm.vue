<template>
  <Form
    :config="formConfig"
    :data="data"
    :schema="schema"
    tag="div"
    @change="handleChange"
  >
    <ObjectField
      as-child
      name="config"
      :omit="fieldsCategory.nonRequired"
      reset-label-path="reset"
    />
    <AdvancedFields>
      <ObjectField
        as-child
        name="config"
        :omit="fieldsCategory.required"
        reset-label-path="reset"
      />
    </AdvancedFields>
  </Form>
</template>

<script setup lang="ts">
import Form from '../shared/Form.vue'
import ObjectField from '../shared/ObjectField.vue'
import AdvancedFields from '../shared/AdvancedFields.vue'

import type { FormConfig, GlobalAction } from '../shared/types'
import type { FormSchema, RecordFieldSchema } from '../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import { computed } from 'vue'

const emit = defineEmits<{
  change: [value: FreeFormPluginData]
  globalAction: [name: GlobalAction, payload: any]
}>()

const { schema } = defineProps<{
  schema: FormSchema
  data?: FreeFormPluginData
}>()

const fieldsCategory = computed(() => {
  const configFields = (schema.fields.find(field => Object.keys(field)[0] === 'config')!.config as RecordFieldSchema).fields
  const required: string[] = []
  const nonRequired: string[] = []

  for (const field of configFields) {
    const fieldName = Object.keys(field)[0]
    if (field[fieldName].required) {
      required.push(fieldName)
    } else {
      nonRequired.push(fieldName)
    }
  }
  return { required, nonRequired }
})

const formConfig: FormConfig = {
  hasValue: (data?: FreeFormPluginData): boolean => !!data?.config,
}

function handleChange(value: FreeFormPluginData) {
  emit('change', value)
}
</script>

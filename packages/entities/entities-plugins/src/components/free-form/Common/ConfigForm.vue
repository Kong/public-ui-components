<template>
  <ObjectField
    as-child
    name="config"
    :omit="fieldsCategory.nonRequired"
    reset-label-path="reset"
  />
  <AdvancedFields
    class="ff-advanced-fields"
    hide-general-fields
  >
    <ObjectField
      as-child
      name="config"
      :omit="fieldsCategory.required"
      reset-label-path="reset"
    />
  </AdvancedFields>
</template>

<script setup lang="ts">
import ObjectField from '../shared/ObjectField.vue'
import AdvancedFields from '../shared/AdvancedFields.vue'

import type { RecordFieldSchema } from '../../../types/plugins/form-schema'
import { computed } from 'vue'
import { useFormShared } from '../shared/composables'

const { getSchema } = useFormShared()

const fieldsCategory = computed(() => {
  const schema = getSchema()
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
</script>

<style lang="scss" scoped>
.ff-advanced-fields {
  border-top: 1px solid $kui-color-border-neutral-weaker;
  margin-top: $kui-space-70;
  padding-top: $kui-space-70;

  :deep(.collapse-heading) {
    margin: 0;
  }
}
</style>

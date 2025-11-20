<template>
  <ObjectField
    as-child
    name="config"
    :omit="fieldsCategory.advanced"
    reset-label-path="reset"
  />
  <AdvancedFields
    class="ff-advanced-fields"
    hide-general-fields
  >
    <ObjectField
      as-child
      name="config"
      :omit="fieldsCategory.defaultVisible"
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

/**
 * Group configuration fields into defaultVisible and advanced categories
 * - defaultVisible: Required fields and fields involved in entity checks
 * - advanced: Optional fields not involved in entity checks
 */
const fieldsCategory = computed(() => {
  const defaultVisible: string[] = []
  const advanced: string[] = []
  const ruledFields: Set<string> = new Set()

  const schema = getSchema()
  const configField = schema.fields.find(field => Object.keys(field)[0] === 'config')
  if (!configField || !('config' in configField)) {
    // If 'config' field is missing, return empty categories to avoid runtime error
    return { defaultVisible, advanced }
  }
  const configSchema = configField.config as RecordFieldSchema

  // Collect fields that are involved in entity checks
  // These fields should be visible by default as they have validation rules
  if (configSchema.entity_checks) {
    configSchema.entity_checks.forEach(check => {
      let fields: string[] | undefined

      // Extract field names from different types of entity checks
      if ('at_least_one_of' in check) {
        fields = check.at_least_one_of
      } else if ('conditional' in check && getSchema(`config.${check.conditional.if_field}`)?.required && check.conditional.then_match.required) {
        // For conditional checks, collect if_field and then_field if if_field is required and then_field is required
        fields = [check.conditional.if_field, check.conditional.then_field]
      } else if ('conditional_at_least_one_of' in check && getSchema(`config.${check.conditional_at_least_one_of.if_field}`)?.required) {
        // For conditional_at_least_one_of checks, collect if_field and all then_at_least_one_of fields if if_field is required
        fields = [check.conditional_at_least_one_of.if_field, ...check.conditional_at_least_one_of.then_at_least_one_of]
      }

      // Add all extracted fields to the ruledFields set
      fields?.forEach(field => ruledFields.add(field))
    })
  }

  // Categorize each field based on its properties
  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]

    // Required fields should always be visible
    if (field[fieldName].required) {
      defaultVisible.push(fieldName)
      continue
    }

    // Fields involved in entity checks should be visible for better UX
    if (ruledFields.has(fieldName)) {
      defaultVisible.push(fieldName)
      continue
    }

    // All other optional fields go to advanced section
    advanced.push(fieldName)
  }

  return { defaultVisible, advanced }
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

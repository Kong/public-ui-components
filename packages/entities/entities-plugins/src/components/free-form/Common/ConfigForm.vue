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
import { resolve } from '../shared/utils'

const { getSchema, useCurrentRenderRules, getDefault, formData } = useFormShared()

const { currentRenderRules } = useCurrentRenderRules({
  fieldPath: 'config',
  rules: undefined,
  getSchema,
  getDefault,
  parentValue: formData.config,
})

/**
 * Group configuration fields into defaultVisible and advanced categories
 * - defaultVisible: Required fields and fields involved in entity checks
 * - advanced: Optional fields not involved in entity checks
 * - Bundles: All fields in a bundle follow the category of the first field
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
      } else if ('conditional' in check && getSchema(resolve('config', check.conditional.if_field))?.required && check.conditional.then_match.required) {
        // For conditional checks, collect if_field and then_field if if_field is required and then_field is required
        fields = [check.conditional.if_field, check.conditional.then_field]
      } else if ('conditional_at_least_one_of' in check && getSchema(resolve('config', check.conditional_at_least_one_of.if_field))?.required) {
        // For conditional_at_least_one_of checks, collect if_field and all then_at_least_one_of fields if if_field is required
        fields = [check.conditional_at_least_one_of.if_field, ...check.conditional_at_least_one_of.then_at_least_one_of]
      }

      // Add all extracted fields to the ruledFields set
      fields?.forEach(field => ruledFields.add(field))
    })
  }

  const bundles = currentRenderRules.value?.bundles

  // Build a map from field name to its bundle array
  // This allows O(1) lookup to check if a field belongs to a bundle
  const bundleMap = new Map<string, string[]>()
  if (bundles) {
    bundles.forEach(bundle => {
      bundle.forEach(fieldName => {
        bundleMap.set(fieldName, bundle)
      })
    })
  }

  // Track which fields have been processed to avoid duplicates
  // This is important because when we encounter a field in a bundle,
  // we process all fields in that bundle at once
  const processedFields = new Set<string>()

  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]

    // Skip if this field was already processed as part of a bundle
    if (processedFields.has(fieldName)) {
      continue
    }

    // Determine the category for this field based on its properties
    // Priority: required > involved in entity_checks > advanced
    let category: 'defaultVisible' | 'advanced'
    if (field[fieldName].required || ruledFields.has(fieldName)) {
      category = 'defaultVisible'
    } else {
      category = 'advanced'
    }

    // Check if this field is part of a bundle
    const bundle = bundleMap.get(fieldName)
    if (bundle) {
      // Process all fields in the bundle together
      // All fields in a bundle share the same category as the first field encountered
      bundle.forEach(bundleFieldName => {
        if (category === 'defaultVisible') {
          defaultVisible.push(bundleFieldName)
        } else {
          advanced.push(bundleFieldName)
        }
        processedFields.add(bundleFieldName)
      })
    } else {
      // Single field not in any bundle
      if (category === 'defaultVisible') {
        defaultVisible.push(fieldName)
      } else {
        advanced.push(fieldName)
      }
      processedFields.add(fieldName)
    }
  }

  return { defaultVisible, advanced }
})
</script>

<style lang="scss" scoped>
.ff-advanced-fields {
  margin-top: $kui-space-80;

  :deep(.collapse-heading) {
    margin: 0;
  }
}
</style>

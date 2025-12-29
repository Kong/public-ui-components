<template>
  <ObjectField
    as-child
    name="config"
    :omit="fieldsCategory.advanced"
    reset-label-path="reset"
  />
  <AdvancedFields
    class="ff-advanced-fields-container"
    data-testid="ff-advanced-fields-container"
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

const { getSchema, createComputedRenderRules } = useFormShared()

const configRenderRules = createComputedRenderRules('config')

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

  // Bundle support: Build dependency map from bundles
  // Each field in a bundle depends on the previous field, forming a dependency chain
  const bundles = configRenderRules.value?.bundles ?? []
  const bundleMap = new Map<string, string>()

  for (const bundle of bundles) {
    for (let i = 1; i < bundle.length; i++) {
      // Map each field to its dependency (the previous field in the bundle)
      bundleMap.set(bundle[i], bundle[i - 1])
    }
  }

  // Helper function to find the root field by recursively following dependencies
  // This handles transitive dependencies (e.g., [A, B], [B, C] => C's root is A)
  const findRoot = (field: string): string => {
    const dep = bundleMap.get(field)
    return dep ? findRoot(dep) : field
  }

  // Cache root lookups to avoid redundant recursion
  const fieldRoots = new Map<string, string>()
  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]
    fieldRoots.set(fieldName, findRoot(fieldName))
  }

  // Categorize each field based on its properties
  // Note: Only process root fields (fields without dependencies) in this loop
  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]

    // Skip non-root fields (fields that have dependencies in bundles)
    // They will be categorized separately to follow their root field's category
    const root = fieldRoots.get(fieldName)!
    if (root !== fieldName) {
      continue
    }

    let finalCategory: string[]

    if (field[fieldName].required) {
      // Required fields should always be visible
      finalCategory = defaultVisible
    } else if (ruledFields.has(fieldName)) {
      // Fields involved in entity checks should be visible for better UX
      finalCategory = defaultVisible
    } else {
      // All other optional fields go to advanced section
      finalCategory = advanced
    }

    finalCategory.push(fieldName)
  }

  // Process fields with dependencies: they follow their root field's category
  // This ensures bundle priority - even if a field is required, it follows its root
  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]
    const root = fieldRoots.get(fieldName)!

    // Only process non-root fields (fields that have dependencies)
    if (root !== fieldName) {
      // Find which category the root field belongs to and add this field there
      const category = defaultVisible.includes(root) ? defaultVisible : advanced
      category.push(fieldName)
    }
  }

  return { defaultVisible, advanced }
})
</script>

<style lang="scss" scoped>
.ff-advanced-fields-container {
  margin-top: $kui-space-80;

  :deep(.collapse-heading) {
    margin: 0;
  }

  // Hide the advanced fields container if there are no advanced fields to show
  &:has(> .collapse-hidden-content > .ff-advanced-fields > .ff-object-field:empty) {
    display: none;
  }
}
</style>

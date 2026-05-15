<template>
  <ObjectField
    as-child
    class="ff-default-visible-fields"
    name="config"
    :omit="requiredFieldsOmit"
    reset-label-path="reset"
  />

  <KongIdentityField
    v-if="isKonnect"
    class="kong-identity-section"
    :has-identity-realms="hasIdentityRealms"
  />

  <AdvancedFields
    v-if="!allFieldsAdvanced"
    class="ff-advanced-fields-container"
    data-testid="ff-advanced-fields-container"
    hide-general-fields
  >
    <ObjectField
      as-child
      name="config"
      :omit="advancedFieldsOmit"
      reset-label-path="reset"
    />
  </AdvancedFields>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import ObjectField from '../../free-form/shared/ObjectField.vue'
import AdvancedFields from '../../free-form/shared/AdvancedFields.vue'
import KongIdentityField from './KongIdentityField.vue'
import { useFormShared } from '../../free-form/shared/composables'
import { resolve } from '../../free-form/shared/utils'
import { FORMS_CONFIG } from '@kong-ui-public/forms'

import type { RecordFieldSchema } from '../../../types/plugins/form-schema'
import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')

const { getSchema, createComputedRenderRules, formData } = useFormShared()

// Auto-detect hasIdentityRealms from schema
const hasIdentityRealms = computed(() => {
  try {
    return !!getSchema('$.config.identity_realms')
  } catch {
    return false
  }
})

const configRenderRules = createComputedRenderRules('config')

// Determine if identity_realms should be shown (only in centrally-managed mode)
const isCentrallyManaged = computed(() => {
  const principals = formData.config?.principals
  const realms = formData.config?.identity_realms
  return !principals && Array.isArray(realms) && realms.length > 0
})

// Fields managed by KongIdentityField — always omit from normal rendering
const identityFields = computed(() => {
  const fields = ['principals']
  // Hide identity_realms when not in centrally-managed mode
  if (hasIdentityRealms.value && !isCentrallyManaged.value) {
    fields.push('identity_realms')
  }
  return fields
})

const fieldsCategory = computed(() => {
  const defaultVisible: string[] = []
  const advanced: string[] = []
  const ruledFields: Set<string> = new Set()

  const schema = getSchema()
  const configField = schema.fields.find(field => Object.keys(field)[0] === 'config')
  if (!configField || !('config' in configField)) {
    return { defaultVisible, advanced }
  }
  const configSchema = configField.config as RecordFieldSchema

  if (configSchema.entity_checks) {
    configSchema.entity_checks.forEach(check => {
      let fields: string[] | undefined

      if ('at_least_one_of' in check) {
        fields = check.at_least_one_of
      } else if ('conditional' in check && getSchema(resolve('config', check.conditional.if_field))?.required && check.conditional.then_match.required) {
        fields = [check.conditional.if_field, check.conditional.then_field]
      } else if ('conditional_at_least_one_of' in check && getSchema(resolve('config', check.conditional_at_least_one_of.if_field))?.required) {
        fields = [check.conditional_at_least_one_of.if_field, ...check.conditional_at_least_one_of.then_at_least_one_of]
      }

      fields?.forEach(field => ruledFields.add(field.split('.')[0]))
    })
  }

  const bundles = configRenderRules.value?.bundles ?? []
  const bundleMap = new Map<string, string>()

  for (const bundle of bundles) {
    for (let i = 1; i < bundle.length; i++) {
      bundleMap.set(bundle[i], bundle[i - 1])
    }
  }

  const findRoot = (field: string): string => {
    const dep = bundleMap.get(field)
    return dep ? findRoot(dep) : field
  }

  const fieldRoots = new Map<string, string>()
  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]
    fieldRoots.set(fieldName, findRoot(fieldName))
  }

  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]

    // Skip identity fields — they are rendered separately
    if (identityFields.value.includes(fieldName)) continue

    const root = fieldRoots.get(fieldName)!
    if (root !== fieldName) continue

    let finalCategory: string[]

    if (field[fieldName].required) {
      finalCategory = defaultVisible
    } else if (ruledFields.has(fieldName)) {
      finalCategory = defaultVisible
    } else {
      finalCategory = advanced
    }

    finalCategory.push(fieldName)
  }

  for (const field of configSchema.fields) {
    const fieldName = Object.keys(field)[0]
    if (identityFields.value.includes(fieldName)) continue

    const root = fieldRoots.get(fieldName)!
    if (root !== fieldName) {
      const category = defaultVisible.includes(root) ? defaultVisible : advanced
      category.push(fieldName)
    }
  }

  return { defaultVisible, advanced }
})

const allFieldsAdvanced = computed(() => fieldsCategory.value.defaultVisible.length === 0)

// Omit advanced fields + identity fields from top section
const requiredFieldsOmit = computed(() => [
  ...(allFieldsAdvanced.value ? [] : fieldsCategory.value.advanced),
  ...identityFields.value,
])

// Omit required fields + identity fields from advanced section
const advancedFieldsOmit = computed(() => [
  ...fieldsCategory.value.defaultVisible,
  ...identityFields.value,
])
</script>

<style lang="scss" scoped>
.kong-identity-section {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-70, $kui-space-70);
  margin-top: var(--kui-space-70, $kui-space-70);
}
</style>

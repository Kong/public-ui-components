<template>
  <KAlert
    v-if="checks"
    data-testid="ff-entity-checks-alert"
  >
    <ul class="ff-entity-checks-list">
      <li
        v-for="(check) in checks"
        :key="check"
        data-testid="ff-entity-check-item"
      >
        {{ check }}
      </li>
    </ul>
  </KAlert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EntityCheck } from '../../../types/plugins/form-schema'
import composables from '../../../composables'
import { defaultLabelFormatter } from './composables'

const { entityChecks, omittedFields } = defineProps<{
  entityChecks?: EntityCheck[]
  omittedFields?: string[]
}>()

const { i18n: { t } } = composables.useI18n()

const checks = computed(() => {
  if (!Array.isArray(entityChecks) || entityChecks.length === 0) {
    return null
  }

  const checks: string[] = []

  const checkTypes = [
    { key: 'at_least_one_of', i18nKey: 'plugins.form.field_rules.at_least_one_of' },
    { key: 'mutually_required', i18nKey: 'plugins.form.field_rules.mutually_required' },
    { key: 'mutually_exclusive', i18nKey: 'plugins.form.field_rules.mutually_exclusive' },
  ] as const

  for (const check of entityChecks) {
    for (const { key, i18nKey } of checkTypes) {
      if (key in check) {
        const fields = check[key as keyof typeof check] as string[]
        if (Array.isArray(fields) && fields.length > 0 && fieldsNotOmitted(fields)) {
          checks.push(t(i18nKey, {
            parameters: formatter(fields),
          }))
        }
        break
      }
    }
  }

  return checks.length ? checks : null
})

function formatter(fields: string[]): string {
  return fields.map(defaultLabelFormatter).join(', ')
}

function fieldsNotOmitted(fields: string[]): boolean {
  if (Array.isArray(omittedFields) && omittedFields.length > 0) {
    const filteredFields = fields.filter(
      (field) => !omittedFields.includes(field),
    )
    return filteredFields.length > 0
  }
  return true
}
</script>

<style scoped lang="scss">
.ff-entity-checks-list {
  list-style: disc;
  margin: 0;
  padding-left: $kui-space-70;
}
</style>

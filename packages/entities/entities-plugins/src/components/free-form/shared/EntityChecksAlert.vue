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
import type { AtLeastOneOfEntityCheck, EntityCheck, MutuallyExclusiveEntityCheck, MutuallyRequiredEntityCheck } from '../../../types/plugins/form-schema'
import composables from '../../../composables'
import { defaultLabelFormatter } from './composables'

const { entityChecks } = defineProps<{
  entityChecks?: EntityCheck[]
}>()

const { i18n: { t } } = composables.useI18n()

const checks = computed(() => {
  if (!Array.isArray(entityChecks) || entityChecks.length === 0) {
    return null
  }

  const checks: string[] = []

  for (const check of entityChecks) {
    if (
      'at_least_one_of' in (check as AtLeastOneOfEntityCheck)
      && Array.isArray((check as AtLeastOneOfEntityCheck).at_least_one_of)
    ) {
      checks.push(t('plugins.form.field_rules.at_least_one_of', {
        parameters: formatter((check as AtLeastOneOfEntityCheck).at_least_one_of),
      }))
    } else if (
      'mutually_required' in (check as MutuallyRequiredEntityCheck)
      && Array.isArray((check as MutuallyRequiredEntityCheck).mutually_required)
    ) {
      checks.push(t('plugins.form.field_rules.mutually_required', {
        parameters: formatter((check as MutuallyRequiredEntityCheck).mutually_required),
      }))
    } else if (
      'mutually_exclusive' in (check as MutuallyExclusiveEntityCheck)
      && Array.isArray((check as MutuallyExclusiveEntityCheck).mutually_exclusive)
    ) {
      checks.push(t('plugins.form.field_rules.mutually_exclusive', {
        parameters: formatter((check as MutuallyExclusiveEntityCheck).mutually_exclusive),
      }))
    }
  }

  return checks.length ? checks : null
})

function formatter(fields: string[]): string {
  return fields.map(defaultLabelFormatter).join(', ')
}
</script>

<style scoped lang="scss">
.ff-entity-checks-list {
  margin: 0;
  padding-left: $kui-space-70
}
</style>

<template>
  <KAlert class="plugin-field-check-alerts">
    <ul>
      <li
        v-for="(alert, i) in formattedAlerts"
        :key="`alert-${i}`"
      >
        {{ alert }}
      </li>

      <li v-if="props.fieldChecks.exactOneOfMutuallyRequired && props.fieldChecks.exactOneOfMutuallyRequired.length > 0">
        <div
          v-for="(combinations, i) in props.fieldChecks.exactOneOfMutuallyRequired"
          :key="`exact-one-mutually-alert-${i}`"
        >
          <div>{{ t('plugins.form.field_checks.exact_one_of_mutually_required') }}</div>
          <ul>
            <li
              v-for="(fields, j) in combinations"
              :key="`exact-one-mutually-alert-${i}-combination-${j}`"
            >
              {{ formatFields(fields) }}
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </KAlert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../composables'
import type { FieldChecks } from '../types'

const props = defineProps<{
  fieldChecks: FieldChecks
}>()

const { formatPluginFieldLabel } = composables.usePluginHelpers()
const { i18n: { t } } = composables.useI18n()

const formattedAlerts = computed<string[]>(() => {
  const alerts = []

  if (props.fieldChecks.atLeastOneOf) {
    for (const fields of props.fieldChecks.atLeastOneOf) {
      alerts.push(formatAlert('plugins.form.field_checks.at_least_one_of', fields))
    }
  }

  if (props.fieldChecks.onlyOneOf) {
    for (const fields of props.fieldChecks.onlyOneOf) {
      alerts.push(formatAlert('plugins.form.field_checks.only_one_of', fields))
    }
  }

  if (props.fieldChecks.mutuallyRequired) {
    for (const fields of props.fieldChecks.mutuallyRequired) {
      alerts.push(formatAlert('plugins.form.field_checks.mutually_required', fields))
    }
  }

  if (props.fieldChecks.exactOneOf) {
    for (const fields of props.fieldChecks.exactOneOf) {
      alerts.push(formatAlert('plugins.form.field_checks.exact_one_of', fields))
    }
  }

  return alerts
})

const formatFields = (fields: string[]) =>
  fields.map((field) => formatPluginFieldLabel(field.replace(/^[cC]onfig\./, ''))).join(', ')

const formatAlert = (translateKey: Parameters<typeof t>[0], fields: string[]) =>
  t(translateKey, { parameters: formatFields(fields) })
</script>

<style scoped lang="scss">
.plugin-field-check-alerts {
  ul {
    margin: 0;
    padding-inline-start: $kui-space-80;
  }

  margin-top: $kui-space-40;
  margin-bottom: $kui-space-60;
}
</style>

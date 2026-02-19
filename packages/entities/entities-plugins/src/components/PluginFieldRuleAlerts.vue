<template>
  <KAlert class="plugin-field-rule-alerts">
    <ul>
      <li
        v-for="(alert, i) in formattedSimpleAlerts"
        :key="`simple-alert-${i}`"
      >
        {{ alert }}
      </li>

      <li v-if="props.rules.onlyOneOfMutuallyRequired && props.rules.onlyOneOfMutuallyRequired.length > 0">
        <div
          v-for="(combinations, i) in props.rules.onlyOneOfMutuallyRequired"
          :key="`only-one-mutually-alert-${i}`"
        >
          <div>{{ t('plugins.form.field_rules.only_one_of_mutually_required') }}</div>
          <ul>
            <li
              v-for="(fields, j) in combinations"
              :key="`only-one-mutually-alert-${i}-combination-${j}`"
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
import type { FieldRules } from '../types'

const props = defineProps<{
  rules: FieldRules
}>()

const { formatPluginFieldLabel } = composables.usePluginHelpers()
const { i18n: { t } } = composables.useI18n()

const formatFields = (fields: string[]) =>
  fields.map((field) =>
    field.replace(/^[cC]onfig\./, '').split('.').map((s) => formatPluginFieldLabel(s)).join('.'),
  ).join(', ')

const formatAlert = (translateKey: Parameters<typeof t>[0], fields: string[]) =>
  t(translateKey, { parameters: formatFields(fields) })

const formattedSimpleAlerts = computed<string[]>(() => {
  const alerts = []

  if (props.rules.atLeastOneOf) {
    for (const fields of props.rules.atLeastOneOf) {
      alerts.push(formatAlert('plugins.form.field_rules.at_least_one_of', fields))
    }
  }

  if (props.rules.onlyOneOf) {
    for (const fields of props.rules.onlyOneOf) {
      alerts.push(formatAlert('plugins.form.field_rules.only_one_of', fields))
    }
  }

  if (props.rules.mutuallyRequired) {
    for (const fields of props.rules.mutuallyRequired) {
      alerts.push(formatAlert('plugins.form.field_rules.mutually_required', fields))
    }
  }

  return alerts
})
</script>

<style scoped lang="scss">
.plugin-field-rule-alerts {
  margin-bottom: var(--kui-space-60, $kui-space-60);
  margin-top: var(--kui-space-40, $kui-space-40);

  ul {
    margin: 0;
    padding-inline-start: var(--kui-space-80, $kui-space-80);
  }
}
</style>

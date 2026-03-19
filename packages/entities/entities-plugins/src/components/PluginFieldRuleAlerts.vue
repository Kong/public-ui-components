<template>
  <KAlert class="plugin-field-rule-alerts">
    <ul>
      <li
        v-for="({ key, fields }, i) in formattedSimpleAlerts"
        :key="`simple-alert-${i}`"
      >
        <i18nT :keypath="key">
          <template #parameters>
            <ReferableFieldItem
              v-for="(field, idx) in fields"
              :key="`alert-field-${field}`"
              :field="field"
              :is-last="idx === fields.length - 1"
            />
          </template>
        </i18nT>
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
              <ReferableFieldItem
                v-for="(field, idx) in fields"
                :key="`only-one-mutually-field-${field}`"
                :field="field"
                :is-last="idx === fields.length - 1"
              />
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
import ReferableFieldItem from './ReferableFieldItem.vue'
import type { FieldRules } from '../types'

const props = defineProps<{
  rules: FieldRules
}>()

const { i18n: { t }, i18nT } = composables.useI18n()

const formattedSimpleAlerts = computed(() => {
  const alerts: Array<{
    key: 'plugins.form.field_rules.at_least_one_of' | 'plugins.form.field_rules.only_one_of' | 'plugins.form.field_rules.mutually_required'
    fields: string[]
  }> = []
  if (props.rules.atLeastOneOf) {
    for (const fields of props.rules.atLeastOneOf) {
      alerts.push({ key: 'plugins.form.field_rules.at_least_one_of', fields })
    }
  }

  if (props.rules.onlyOneOf) {
    for (const fields of props.rules.onlyOneOf) {
      alerts.push({ key: 'plugins.form.field_rules.only_one_of', fields })
    }
  }

  if (props.rules.mutuallyRequired) {
    for (const fields of props.rules.mutuallyRequired) {
      alerts.push({ key: 'plugins.form.field_rules.mutually_required', fields })
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

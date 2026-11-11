<template>
  <KCard class="cb-circuit-card">
    <div class="cb-circuit-header">
      <SwitchField
        v-if="has('enabled')"
        :disabled-text="title"
        :enabled-text="title"
        label=""
        :name="path('enabled')"
      />
      <div class="cb-circuit-description">
        {{ description }}
      </div>
    </div>

    <div
      v-if="expanded"
      class="cb-circuit-body"
    >
      <!-- RadioField has a multi-root template, so the class needs a wrapper. -->
      <div
        v-if="has('open_when')"
        class="cb-threshold-condition"
      >
        <RadioField
          :items="thresholdConditionItems"
          :label="t('plugins.free-form.kong-circuit-breaker.sections.threshold_condition.title')"
          :name="path('open_when')"
        />
      </div>

      <section
        v-if="hasAny(['max_failures', 'failure_percentage'])"
        class="cb-group"
      >
        <h4 class="cb-group-title">
          {{ t('plugins.free-form.kong-circuit-breaker.sections.thresholds.title') }}
        </h4>
        <div class="cb-row">
          <NumberField
            v-if="has('max_failures')"
            :label="f('max_failures.label')"
            :name="path('max_failures')"
          />
          <NumberField
            v-if="has('failure_percentage')"
            :label="f('failure_percentage.label')"
            :name="path('failure_percentage')"
          />
        </div>
      </section>

      <section
        v-if="hasAny(OTHER_SETTINGS)"
        class="cb-group"
      >
        <h4 class="cb-group-title">
          {{ t('plugins.free-form.kong-circuit-breaker.sections.other_settings.title') }}
        </h4>
        <div class="cb-row">
          <!-- Latency circuit leads with the slow-response threshold. -->
          <NumberField
            v-if="has('max_upstream_ttfb_ms')"
            :label="f('max_upstream_response_time.label')"
            :name="path('max_upstream_ttfb_ms')"
          />
          <NumberField
            v-if="has('sampling_window_seconds')"
            :label="f('sampling_window.label')"
            :name="path('sampling_window_seconds')"
          />
          <NumberField
            v-if="has('recovery_period_ms')"
            :label="f('recovery_period.label')"
            :name="path('recovery_period_ms')"
          />
          <EnumField
            v-if="has('window_type')"
            :items="optionsOf('window_type')"
            :name="path('window_type')"
          />
          <NumberField
            v-if="has('min_samples')"
            :name="path('min_samples')"
          />
        </div>
      </section>

      <EnumField
        v-if="has('failure_types')"
        :help="f('failure_types.help')"
        :items="optionsOf('failure_types')"
        :label="f('failure_types.label')"
        multiple
        :name="path('failure_types')"
      />
    </div>
  </KCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KCard } from '@kong/kongponents'
import { EnumField, NumberField, SwitchField, useFormShared } from '@kong-ui-public/freeform'
import RadioField from '../../components/RadioField.vue'
import useI18n from '../../../../composables/useI18n'

const { circuit, title, description } = defineProps<{
  /** The circuit's record name under `config`, e.g. `policy_circuit`. */
  circuit: string
  title: string
  description: string
}>()

/** Rendered in the order the design lists them; absent ones drop out. */
const OTHER_SETTINGS = [
  'max_upstream_ttfb_ms',
  'sampling_window_seconds',
  'recovery_period_ms',
  'window_type',
  'min_samples',
]

const { i18n: { t } } = useI18n()

/** `t` only accepts keys of the locale file; the prefix is fixed, the leaf is not. */
type MessageKey = Parameters<typeof t>[0]

const f = (key: string) => t(`plugins.free-form.kong-circuit-breaker.fields.${key}` as MessageKey)
const { formData, getSchema, getSelectItems } = useFormShared<Record<string, any>>()

const path = (field: string) => `config.${circuit}.${field}`

/**
 * The Gateway owns the field list, and this plugin's schema is still changing.
 * A field component built on a path the schema doesn't have throws while
 * resolving its label, so every field is rendered only when the schema has it.
 */
const has = (field: string) => !!getSchema(path(field))
const hasAny = (fields: string[]) => fields.some(has)

/**
 * The design spells enum options out ("Backend connection failure"), where the
 * schema carries raw `one_of` values. Derived rather than translated so a new
 * Gateway value still reads correctly.
 */
const optionsOf = (field: string) => getSelectItems(path(field)).map(item => ({
  ...item,
  label: String(item.value)
    .replace(/_/g, ' ')
    .replace(/^./, char => char.toUpperCase())
    .replace(/\bhttp\b/i, 'HTTP'),
}))

/** A circuit with no `enabled` flag has nothing to collapse. */
const expanded = computed<boolean>(() => !has('enabled') || !!formData.config?.[circuit]?.enabled)

const thresholdConditionItems = computed(() => [
  { value: 'max_failures', label: f('open_when.options.max_failures') },
  { value: 'failure_percentage', label: f('open_when.options.failure_percentage') },
  { value: 'both', label: f('open_when.options.both') },
  { value: 'either', label: f('open_when.options.either') },
].filter(item => (getSchema(path('open_when'))?.one_of ?? []).includes(item.value)))
</script>

<style lang="scss" scoped>
// KCard owns its own padding; the gap has to live on the content it wraps.
.cb-circuit-card :deep(.card-content) {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);
}

.cb-circuit-header {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-20, $kui-space-20);

  :deep(.k-input-switch-label) {
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  }
}

.cb-circuit-description {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  // Aligns with the switch label rather than the switch itself.
  padding-left: var(--kui-space-100, $kui-space-100);
}

.cb-circuit-body {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);
}

.cb-group {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);

  &-title {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    margin: 0;
  }
}

// Two columns, wrapping; the design pairs fields left-to-right.
.cb-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-50, $kui-space-50) var(--kui-space-70, $kui-space-70);

  > * {
    flex: 0 1 calc(50% - var(--kui-space-70, $kui-space-70) / 2);
    min-width: 0;
  }
}

// The design lists the four threshold conditions one per line.
.cb-threshold-condition :deep(.horizontal-container) {
  align-items: flex-start;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}
</style>

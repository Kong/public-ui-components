<template>
  <div class="cb-form">
    <KAlert
      appearance="info"
      data-testid="cb-circuits-hint"
      :message="t('plugins.free-form.kong-circuit-breaker.hint')"
    />

    <CircuitCard
      v-if="has('config.policy_circuit')"
      circuit="policy_circuit"
      :description="f('policy_circuit.description')"
      :title="f('policy_circuit.label')"
    />

    <CircuitCard
      v-if="has('config.latency_circuit')"
      circuit="latency_circuit"
      :description="f('latency_circuit.description')"
      :title="f('latency_circuit.label')"
    />

    <AdvancedFields hide-general-fields>
      <div class="cb-advanced">
        <section
          v-if="has('config.identifier')"
          class="cb-section"
        >
          <h4 class="cb-section-title">
            {{ t('plugins.free-form.kong-circuit-breaker.sections.identification.title') }}
          </h4>
          <RadioField
            :items="identifierItems"
            :label="f('identifier.label')"
            name="config.identifier"
          />
        </section>

        <section
          v-if="hasAny(RECOVERY_FIELDS)"
          class="cb-section"
        >
          <h4 class="cb-section-title">
            {{ t('plugins.free-form.kong-circuit-breaker.sections.recovery.title') }}
          </h4>
          <div class="cb-row">
            <NumberField
              v-if="has('config.half_open_calls')"
              :label="f('half_open_calls.label')"
              name="config.half_open_calls"
            />
            <NumberField
              v-if="has('config.half_open_failure_threshold_percent')"
              :label="f('half_open_failure_threshold.label')"
              name="config.half_open_failure_threshold_percent"
            />
            <NumberField
              v-if="has('config.half_open_timeout_seconds')"
              :label="f('half_open_timeout.label')"
              name="config.half_open_timeout_seconds"
            />
          </div>
        </section>

        <section
          v-if="hasAny(REQUEST_HANDLING_FIELDS)"
          class="cb-section"
        >
          <h4 class="cb-section-title">
            {{ t('plugins.free-form.kong-circuit-breaker.sections.request_handling.title') }}
          </h4>
          <div class="cb-row">
            <NumberField
              v-if="has('config.response_code')"
              :label="f('response_code.label')"
              name="config.response_code"
            />
            <StringField
              v-if="has('config.response_content_type')"
              name="config.response_content_type"
            />
          </div>
          <StringField
            v-if="has('config.response_body')"
            name="config.response_body"
          />
        </section>

        <ObjectField
          as-child
          name="config"
          :omit="PRIMARY_FIELDS"
          reset-label-path="reset"
        />
      </div>
    </AdvancedFields>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KAlert } from '@kong/kongponents'
import { NumberField, ObjectField, StringField, useFormShared } from '@kong-ui-public/freeform'
import AdvancedFields from '../../components/AdvancedFields.vue'
import RadioField from '../../components/RadioField.vue'
import CircuitCard from './CircuitCard.vue'
import useI18n from '../../../../composables/useI18n'

const RECOVERY_FIELDS = [
  'config.half_open_calls',
  'config.half_open_failure_threshold_percent',
  'config.half_open_timeout_seconds',
]
const REQUEST_HANDLING_FIELDS = [
  'config.response_code',
  'config.response_content_type',
  'config.response_body',
]

/**
 * Fields rendered by hand above; kept out of the Advanced leftovers so nothing
 * renders twice while unknown/newer schema fields still show up there.
 */
const PRIMARY_FIELDS = [
  'policy_circuit',
  'latency_circuit',
  'identifier',
  ...[...RECOVERY_FIELDS, ...REQUEST_HANDLING_FIELDS].map(path => path.slice('config.'.length)),
]

const { i18n: { t } } = useI18n()

/** `t` only accepts keys of the locale file; the prefix is fixed, the leaf is not. */
type MessageKey = Parameters<typeof t>[0]

const f = (key: string) => t(`plugins.free-form.kong-circuit-breaker.fields.${key}` as MessageKey)

const { getSchema } = useFormShared()

/** The schema is still changing; a field built on a missing path throws. */
const has = (path: string) => !!getSchema(path)
const hasAny = (paths: string[]) => paths.some(has)

/** Offer only what the schema accepts, like the threshold condition does. */
const identifierItems = computed(() => [
  { value: 'service', label: f('identifier.options.service') },
  { value: 'route', label: f('identifier.options.route') },
].filter(item => (getSchema('config.identifier')?.one_of ?? []).includes(item.value)))
</script>

<style lang="scss" scoped>
.cb-form {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);
}

.cb-advanced {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);
}

.cb-section {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-50, $kui-space-50);

  &-title {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    margin: 0;
  }
}

// Two columns, matching the circuit cards.
.cb-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--kui-space-50, $kui-space-50) var(--kui-space-70, $kui-space-70);

  > * {
    flex: 0 1 calc(50% - var(--kui-space-70, $kui-space-70) / 2);
    min-width: 0;
  }
}
</style>

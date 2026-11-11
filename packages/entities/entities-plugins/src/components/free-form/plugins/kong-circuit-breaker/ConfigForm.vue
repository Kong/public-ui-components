<template>
  <div class="cb-form">
    <KAlert
      appearance="info"
      data-testid="cb-circuits-hint"
      :message="t('plugins.free-form.kong-circuit-breaker.hint')"
    />

    <!-- Policy failure circuit -->
    <KCard class="cb-circuit-card">
      <div class="cb-circuit-header">
        <SwitchField
          :disabled-text="f('failure_circuit.label')"
          :enabled-text="f('failure_circuit.label')"
          label=""
          name="config.failure_circuit.enabled"
        />
        <div class="cb-circuit-description">
          {{ f('failure_circuit.description') }}
        </div>
      </div>

      <div
        v-if="failureCircuitEnabled"
        class="cb-circuit-body"
      >
        <div class="cb-row">
          <NumberField
            :label="f('max_failure_count.label')"
            name="config.failure_circuit.max_failure_count"
          />
          <FieldWithUnit :unit="u('seconds')">
            <NumberField
              :label="f('sampling_window.label')"
              name="config.failure_circuit.sampling_window"
            />
          </FieldWithUnit>
          <FieldWithUnit :unit="u('seconds')">
            <NumberField
              :label="f('recovery_period.label')"
              name="config.failure_circuit.recovery_period"
            />
          </FieldWithUnit>
        </div>

        <div class="cb-row">
          <FieldWithUnit :unit="u('percent')">
            <NumberField
              :label="f('failure_percentage.label')"
              name="config.failure_circuit.failure_percentage"
            />
          </FieldWithUnit>
          <div class="cb-row-filler" />
          <div class="cb-row-filler" />
        </div>

        <EnumField
          :help="f('failure_types.help')"
          :label="f('failure_types.label')"
          multiple
          name="config.failure_circuit.failure_types"
        />
      </div>
    </KCard>

    <!-- Latency circuit -->
    <KCard class="cb-circuit-card">
      <div class="cb-circuit-header">
        <SwitchField
          :disabled-text="f('latency_circuit.label')"
          :enabled-text="f('latency_circuit.label')"
          label=""
          name="config.latency_circuit.enabled"
        />
        <div class="cb-circuit-description">
          {{ f('latency_circuit.description') }}
        </div>
      </div>

      <div
        v-if="latencyCircuitEnabled"
        class="cb-circuit-body"
      >
        <div class="cb-row">
          <FieldWithUnit :unit="u('milliseconds')">
            <NumberField
              :label="f('max_upstream_response_time.label')"
              name="config.latency_circuit.max_upstream_response_time"
            />
          </FieldWithUnit>
          <NumberField
            :label="f('max_failure_count.label')"
            name="config.latency_circuit.max_failure_count"
          />
          <FieldWithUnit :unit="u('seconds')">
            <NumberField
              :label="f('sampling_window.label')"
              name="config.latency_circuit.sampling_window"
            />
          </FieldWithUnit>
        </div>

        <div class="cb-row">
          <EnumField
            :label="f('window_type.label')"
            name="config.latency_circuit.window_type"
          />
          <FieldWithUnit :unit="u('seconds')">
            <NumberField
              :label="f('recovery_period.label')"
              name="config.latency_circuit.recovery_period"
            />
          </FieldWithUnit>
          <div class="cb-row-filler" />
        </div>
      </div>
    </KCard>

    <AdvancedFields hide-general-fields>
      <div class="cb-advanced">
        <section class="cb-section">
          <h4 class="cb-section-title">
            {{ t('plugins.free-form.kong-circuit-breaker.sections.identification.title') }}
          </h4>
          <RadioField
            :items="groupCircuitsByItems"
            :label="f('group_circuits_by.label')"
            name="config.group_circuits_by"
          />

          <div class="cb-excluded-paths">
            <ArrayField
              :add-item-label="f('excluded_paths.add')"
              :label="f('excluded_paths.label')"
              name="config.excluded_paths"
            >
              <template #item="{ autofocus, fieldName }">
                <StringField
                  :autofocus="autofocus"
                  :label="f('excluded_paths.path.label')"
                  :name="`${fieldName}.path`"
                  :placeholder="f('excluded_paths.path.placeholder')"
                />
                <StringField
                  :label="f('excluded_paths.method.label')"
                  :name="`${fieldName}.method`"
                  :placeholder="f('excluded_paths.method.placeholder')"
                />
              </template>
            </ArrayField>
          </div>
        </section>

        <section class="cb-section">
          <h4 class="cb-section-title">
            {{ t('plugins.free-form.kong-circuit-breaker.sections.recovery.title') }}
          </h4>
          <div class="cb-row">
            <NumberField
              :label="f('half_open_requests.label')"
              name="config.half_open_requests"
            />
            <FieldWithUnit :unit="u('percent')">
              <NumberField
                :label="f('half_open_failure_threshold.label')"
                name="config.half_open_failure_threshold"
              />
            </FieldWithUnit>
            <FieldWithUnit :unit="u('seconds')">
              <NumberField
                :label="f('half_open_timeout.label')"
                name="config.half_open_timeout"
              />
            </FieldWithUnit>
          </div>
        </section>

        <section class="cb-section">
          <h4 class="cb-section-title">
            {{ t('plugins.free-form.kong-circuit-breaker.sections.request_handling.title') }}
          </h4>
          <div class="cb-row">
            <NumberField
              :label="f('response_status_code.label')"
              name="config.response_status_code"
            />
            <div class="cb-row-filler" />
            <div class="cb-row-filler" />
          </div>
          <StringField
            :label="f('response_body.label')"
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
import { ArrayField, EnumField, NumberField, ObjectField, StringField, SwitchField, useFormShared } from '@kong-ui-public/freeform'
import AdvancedFields from '../../components/AdvancedFields.vue'
import RadioField from '../../components/RadioField.vue'
import FieldWithUnit from './FieldWithUnit.vue'
import useI18n from '../../../../composables/useI18n'

/** Only the parts this form reads directly; the rest stays schema-driven. */
interface CircuitBreakerFormData {
  config?: {
    failure_circuit?: { enabled?: boolean }
    latency_circuit?: { enabled?: boolean }
  }
}

/**
 * Fields rendered by hand above; kept out of the Advanced leftovers so nothing
 * renders twice while unknown/newer schema fields still show up there.
 */
const PRIMARY_FIELDS = [
  'failure_circuit',
  'latency_circuit',
  'group_circuits_by',
  'excluded_paths',
  'half_open_requests',
  'half_open_failure_threshold',
  'half_open_timeout',
  'response_status_code',
  'response_body',
]

const { i18n: { t } } = useI18n()

/** `t` only accepts keys of the locale file; the prefix is fixed, the leaf is not. */
type MessageKey = Parameters<typeof t>[0]

/** Field copy lives under a single namespace; `f`/`u` keep the template readable. */
const f = (key: string) => t(`plugins.free-form.kong-circuit-breaker.fields.${key}` as MessageKey)
const u = (key: string) => t(`plugins.free-form.kong-circuit-breaker.units.${key}` as MessageKey)

const { formData } = useFormShared<CircuitBreakerFormData>()

const failureCircuitEnabled = computed<boolean>(() => !!formData.config?.failure_circuit?.enabled)
const latencyCircuitEnabled = computed<boolean>(() => !!formData.config?.latency_circuit?.enabled)

const groupCircuitsByItems = computed(() => [
  { value: 'service', label: f('group_circuits_by.options.service') },
  { value: 'route', label: f('group_circuits_by.options.route') },
])
</script>

<style lang="scss" scoped>
.cb-form {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);
}

// KCard owns its own padding; the gap has to live on the content it wraps.
.cb-circuit-card :deep(.card-content) {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);
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
  gap: var(--kui-space-60, $kui-space-60);
}

.cb-row {
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
    min-width: 0;
  }
}

.cb-advanced {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);
}

.cb-section {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-60, $kui-space-60);

  &-title {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    margin: 0;
  }
}

// The path/method pair reads as one row inside each repeater card.
.cb-excluded-paths {
  :deep(.ff-array-field-item-content) {
    display: flex;
    flex-direction: row;
    gap: var(--kui-space-60, $kui-space-60);
    width: 100%;

    > * {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  :deep(.card-content) {
    align-items: flex-start;
  }

  :deep(.ff-array-field-item-remove-tooltip) {
    align-self: flex-end;
    margin-bottom: var(--kui-space-20, $kui-space-20);
  }
}
</style>

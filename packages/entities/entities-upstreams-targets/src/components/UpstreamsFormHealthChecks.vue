<template>
  <EntityFormSection
    class="kong-ui-entities-upstreams-healthchecks"
    :title="t('upstreams.form.health_check.title')"
  >
    <template #description>
      <p>
        {{ t('upstreams.form.health_check.help') }}
        <KExternalLink
          hide-icon
          :href="links.loadBalancing"
        >
          {{ t('upstreams.form.buttons.view_documentation') }}
        </KExternalLink>
      </p>
    </template>

    <KCard>
      <h5 class="fields-group-title">
        {{ t('upstreams.form.fields.active_health_checks.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.fields.active_health_checks.help') }}
      </p>

      <KInputSwitch
        class="active-health-switch"
        data-testid="active-health-switch"
        :disabled="readonly"
        :model-value="activeHealthSwitch"
        @change="emit('update:active-health-switch', $event)"
      />
    </KCard>

    <KCard>
      <h5 class="fields-group-title">
        {{ t('upstreams.form.fields.passive_health_checks.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.fields.passive_health_checks.help') }}
      </p>

      <KInputSwitch
        class="passive-health-switch"
        data-testid="passive-health-switch"
        :disabled="readonly"
        :model-value="passiveHealthSwitch"
        @change="emit('update:passive-health-switch', $event)"
      />
    </KCard>

    <KInput
      autocomplete="off"
      data-testid="upstreams-form-healthchecks-threshold"
      :label="t('upstreams.form.fields.healthchecks_threshold.label')"
      :max="ThresholdMaxNumber"
      :min="ThresholdMinNumber"
      :model-value="healthchecksThreshold"
      :readonly="readonly"
      type="number"
      @update:model-value="emit('update:healthchecks-threshold', $event)"
    />
  </EntityFormSection>
</template>

<script lang="ts" setup>
import {
  EntityFormSection,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import links from '../links'
import { ThresholdMaxNumber, ThresholdMinNumber } from '../constants'

const { i18n: { t } } = composables.useI18n()

defineProps({
  activeHealthSwitch: {
    type: Boolean,
    required: true,
  },
  passiveHealthSwitch: {
    type: Boolean,
    required: true,
  },
  healthchecksThreshold: {
    type: String,
    required: true,
  },
  readonly: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update:active-health-switch', val: boolean): void
  (e: 'update:passive-health-switch', val: boolean): void
  (e: 'update:healthchecks-threshold', val: string): void
}>()
</script>

<style scoped lang="scss">
.fields-group {
  &-title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: 600;
    line-height: 20px;
    margin-bottom: var(--kui-space-20, $kui-space-20);
    margin-top: 0;
  }

  &-text {
    color: var(--kui-color-text-disabled, $kui-color-text-disabled);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: 20px;
    margin-bottom: var(--kui-space-80, $kui-space-80);
    margin-top: 0;
  }
}
</style>

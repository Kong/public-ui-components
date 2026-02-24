<template>
  <EntityFormSection
    class="kong-ui-entities-upstreams-passive-healthcheck"
    :title="t('upstreams.form.passive_health_check.title')"
  >
    <template #description>
      <p>
        {{ t('upstreams.form.passive_health_check.help') }}
        <KExternalLink
          hide-icon
          :href="links.upstreamObject"
        >
          {{ t('upstreams.form.buttons.view_documentation') }}
        </KExternalLink>
      </p>
    </template>

    <KSelect
      class="passive-healthcheck-type-select"
      :items="(typeItems as SelectItem[])"
      :label="t('upstreams.form.fields.passive_health_check_type.label')"
      :model-value="type"
      :readonly="readonly"
      width="100%"
      @update:model-value="emit('update:type', $event as HealthCheckType)"
    />

    <KCard>
      <h5 class="fields-group-title">
        {{ t('upstreams.form.passive_healthy.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.passive_healthy.help') }}
      </p>

      <KInput
        autocomplete="off"
        data-testid="passive-healthcheck-healthy-successes"
        :label="t('upstreams.form.fields.successes.label')"
        :max="SuccessOrFailureMaxNumber"
        :min="SuccessOrFailureMinNumber"
        :model-value="healthySuccesses"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:healthy-successes', $event)"
      />

      <KMultiselect
        v-if="!isTcp"
        class="margin-top-6 passive-healthcheck-healthy-http-statuses"
        enable-item-creation
        :items="HTTPStatuses"
        :label="t('upstreams.form.fields.http_statuses.label')"
        :model-value="healthyHttpStatuses"
        :readonly="readonly"
        width="100%"
        @item-added="(item: MultiselectItem) => trackHealthyItem(item, true)"
        @item-removed="(item: MultiselectItem) => trackHealthyItem(item, false)"
        @update:model-value="emit('update:healthy-http-statuses', $event)"
      />
    </KCard>

    <KCard>
      <h5 class="fields-group-title">
        {{ t('upstreams.form.passive_unhealthy.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.passive_unhealthy.help') }}
      </p>

      <KInput
        autocomplete="off"
        data-testid="passive-healthcheck-unhealthy-timeouts"
        :label="t('upstreams.form.fields.timeouts.label')"
        :max="TimeoutsMaxNumber"
        :min="TimeoutsMinNumber"
        :model-value="unhealthyTimeouts"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:unhealthy-timeouts', $event)"
      />

      <KInput
        autocomplete="off"
        class="margin-top-6"
        data-testid="passive-healthcheck-unhealthy-tcp-failures"
        :label="t('upstreams.form.fields.tcp_failures.label')"
        :max="SuccessOrFailureMaxNumber"
        :min="SuccessOrFailureMinNumber"
        :model-value="unhealthyTcpFailures"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:unhealthy-tcp-failures', $event)"
      />

      <KInput
        v-if="!isTcp"
        autocomplete="off"
        class="margin-top-6"
        data-testid="passive-healthcheck-unhealthy-http-failures"
        :label="t('upstreams.form.fields.http_failures.label')"
        :max="SuccessOrFailureMaxNumber"
        :min="SuccessOrFailureMinNumber"
        :model-value="unhealthyHttpFailures"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:unhealthy-http-failures', $event)"
      />

      <KMultiselect
        v-if="!isTcp"
        autocomplete="off"
        class="margin-top-6 passive-healthcheck-unhealthy-http-statuses"
        data-testid="passive-healthcheck-unhealthy-http-statuses"
        enable-item-creation
        :items="HTTPStatuses"
        :label="t('upstreams.form.fields.http_statuses.label')"
        :model-value="unhealthyHttpStatuses"
        :readonly="readonly"
        width="100%"
        @item-added="(item: MultiselectItem) => trackUnhealthyItem(item, true)"
        @item-removed="(item: MultiselectItem) => trackUnhealthyItem(item, false)"
        @update:model-value="emit('update:unhealthy-http-statuses', $event)"
      />
    </KCard>
  </EntityFormSection>
</template>

<script lang="ts" setup>
import {
  EntityFormSection,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'
import type { HealthCheckType, HealthCheckTypeSelectItem } from '../types'
import {
  HTTPStatuses,
  PassiveHealthyHttpStatuses,
  PassiveUnhealthyHttpStatuses,
  SuccessOrFailureMaxNumber,
  SuccessOrFailureMinNumber,
  TimeoutsMaxNumber,
  TimeoutsMinNumber,
} from '../constants'
import useMultiselectCreation from '../composables/useMultiselectCreation'

import type { MultiselectItem, SelectItem } from '@kong/kongponents'
import links from '../links'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  type: {
    type: String as PropType<HealthCheckType>,
    required: true,
  },
  healthySuccesses: {
    type: String,
    required: true,
  },
  healthyHttpStatuses: {
    type: Array as PropType<string[]>,
    required: true,
  },
  unhealthyTimeouts: {
    type: String,
    required: true,
  },
  unhealthyHttpFailures: {
    type: String,
    required: true,
  },
  unhealthyHttpStatuses: {
    type: Array as PropType<string[]>,
    required: true,
  },
  unhealthyTcpFailures: {
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
  (e: 'update:type', val: HealthCheckType): void
  (e: 'update:healthy-successes', val: string): void
  (e: 'update:healthy-http-statuses', val: string[]): void
  (e: 'update:unhealthy-timeouts', val: string): void
  (e: 'update:unhealthy-http-failures', val: string): void
  (e: 'update:unhealthy-http-statuses', val: string[]): void
  (e: 'update:unhealthy-tcp-failures', val: string): void
}>()

const typeItems = ref<HealthCheckTypeSelectItem[]>([
  {
    label: t('upstreams.form.healthcheck_type_labels.http'),
    value: 'http',
    selected: false,
  },
  {
    label: t('upstreams.form.healthcheck_type_labels.https'),
    value: 'https',
    selected: false,
  },
  {
    label: t('upstreams.form.healthcheck_type_labels.tcp'),
    value: 'tcp',
    selected: false,
  },
  {
    label: t('upstreams.form.healthcheck_type_labels.grsp'),
    value: 'grpc',
    selected: false,
  },
  {
    label: t('upstreams.form.healthcheck_type_labels.grsps'),
    value: 'grpcs',
    selected: false,
  },
])

const isTcp = computed((): boolean => props.type === 'tcp')

const {
  trackNewItems: trackHealthyItem,
} = useMultiselectCreation({ replaceId: true })
const {
  trackNewItems: trackUnhealthyItem,
} = useMultiselectCreation({ replaceId: true })

watch(() => props.type, (val, oldVal) => {
  // clear tcpFailures value if type !== 'tcp'
  if (oldVal === 'tcp' && val !== oldVal) {
    emit('update:unhealthy-tcp-failures', '5')
  }
  // clear unhealthyHttpStatuses and httpStatuses values if type === 'tcp'
  if (oldVal !== 'tcp' && val === 'tcp') {
    emit('update:healthy-http-statuses', PassiveHealthyHttpStatuses)
    emit('update:unhealthy-http-statuses', PassiveUnhealthyHttpStatuses)
  }
})
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

.margin-top-6 {
  margin-top: var(--kui-space-80, $kui-space-80);
}
</style>

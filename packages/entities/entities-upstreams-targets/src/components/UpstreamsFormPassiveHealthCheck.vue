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
      appearance="select"
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
        data-testid="passive-healthcheck-successes"
        :label="t('upstreams.form.fields.successes.label')"
        :max="SuccessOrFailureMaxNumber"
        :min="SuccessOrFailureMinNumber"
        :model-value="successes"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:successes', $event)"
      />

      <KMultiselect
        v-if="!isTcp"
        class="margin-top-6 passive-healthcheck-http-statuses"
        enable-item-creation
        :items="HTTPStatuses"
        :label="t('upstreams.form.fields.http_statuses.label')"
        :model-value="httpStatuses"
        :readonly="readonly"
        width="100%"
        @item:added="(item: MultiselectItem) => trackHealthyItem(item, true)"
        @item:removed="(item: MultiselectItem) => trackHealthyItem(item, false)"
        @update:model-value="emit('update:http-statuses', $event)"
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
        data-testid="passive-healthcheck-timeouts"
        :label="t('upstreams.form.fields.timeouts.label')"
        :max="TimeoutsMaxNumber"
        :min="TimeoutsMinNumber"
        :model-value="timeouts"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:timeouts', $event)"
      />

      <KInput
        v-if="isTcp"
        autocomplete="off"
        class="margin-top-6"
        data-testid="passive-healthcheck-tcp-failures"
        :label="t('upstreams.form.fields.tcp_failures.label')"
        :max="SuccessOrFailureMaxNumber"
        :min="SuccessOrFailureMinNumber"
        :model-value="tcpFailures"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:tcp-failures', $event)"
      />

      <template v-else>
        <KInput
          autocomplete="off"
          class="margin-top-6"
          data-testid="passive-healthcheck-http-failures"
          :label="t('upstreams.form.fields.http_failures.label')"
          :max="SuccessOrFailureMaxNumber"
          :min="SuccessOrFailureMinNumber"
          :model-value="httpFailures"
          :readonly="readonly"
          type="number"
          @update:model-value="emit('update:http-failures', $event)"
        />
        <KMultiselect
          autocomplete="off"
          class="margin-top-6 passive-healthcheck-unhealthy-http-statuses"
          enable-item-creation
          :items="HTTPStatuses"
          :label="t('upstreams.form.fields.http_statuses.label')"
          :model-value="unhealthyHttpStatuses"
          :readonly="readonly"
          width="100%"
          @item:added="(item: MultiselectItem) => trackUnhealthyItem(item, true)"
          @item:removed="(item: MultiselectItem) => trackUnhealthyItem(item, false)"
          @update:model-value="emit('update:unhealthy-http-statuses', $event)"
        />
      </template>
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MultiselectItem, SelectItem } from '@kong/kongponents'
import links from '../links'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  type: {
    type: String as PropType<HealthCheckType>,
    required: true,
  },
  successes: {
    type: String,
    required: true,
  },
  httpStatuses: {
    type: Array as PropType<string[]>,
    required: true,
  },
  timeouts: {
    type: String,
    required: true,
  },
  httpFailures: {
    type: String,
    required: true,
  },
  unhealthyHttpStatuses: {
    type: Array as PropType<string[]>,
    required: true,
  },
  tcpFailures: {
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
  (e: 'update:successes', val: string): void
  (e: 'update:http-statuses', val: string[]): void
  (e: 'update:timeouts', val: string): void
  (e: 'update:http-failures', val: string): void
  (e: 'update:unhealthy-http-statuses', val: string[]): void
  (e: 'update:tcp-failures', val: string): void
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
    emit('update:tcp-failures', '5')
  }
  // clear unhealthyHttpStatuses and httpStatuses values if type === 'tcp'
  if (oldVal !== 'tcp' && val === 'tcp') {
    emit('update:http-statuses', PassiveHealthyHttpStatuses)
    emit('update:unhealthy-http-statuses', PassiveUnhealthyHttpStatuses)
  }
})
</script>

<style scoped lang="scss">
.fields-group {
  &-title {
    color: $kui-color-text;
    font-size: $kui-font-size-40;
    font-weight: 600;
    line-height: 20px;
    margin-bottom: $kui-space-20;
    margin-top: 0;
  }
  &-text {
    color: $kui-color-text-disabled;
    font-size: $kui-font-size-30;
    line-height: 20px;
    margin-bottom: $kui-space-80;
    margin-top: 0;
  }
}
.margin-top-6 {
  margin-top: $kui-space-80;
}
</style>

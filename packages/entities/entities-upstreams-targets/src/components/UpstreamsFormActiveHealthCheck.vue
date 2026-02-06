<template>
  <EntityFormSection
    class="kong-ui-entities-upstreams-active-healthcheck"
    :title="t('upstreams.form.active_health_check.title')"
  >
    <template #description>
      <p>
        {{ t('upstreams.form.active_health_check.help') }}
        <KExternalLink
          hide-icon
          :href="links.upstreamObject"
        >
          {{ t('upstreams.form.buttons.view_documentation') }}
        </KExternalLink>
      </p>
    </template>

    <KSelect
      class="active-healthcheck-type-select"
      :items="(typeItems as SelectItem[])"
      :label="t('upstreams.form.fields.active_healthcheck_type.label')"
      :model-value="type"
      :readonly="readonly"
      width="100%"
      @update:model-value="emit('update:type', $event as HealthCheckType)"
    />

    <KInput
      v-if="!isTcp"
      autocomplete="off"
      data-testid="active-healthcheck-http-path"
      :label="t('upstreams.form.fields.http_path.label')"
      :model-value="httpPath"
      :readonly="readonly"
      type="text"
      @update:model-value="emit('update:http-path', $event)"
    />

    <KInput
      autocomplete="off"
      data-testid="active-healthcheck-timeout"
      :label="t('upstreams.form.fields.timeout.label')"
      :max="TimeoutMaxNumber"
      :min="TimeoutMinNumber"
      :model-value="timeout"
      :readonly="readonly"
      type="number"
      @update:model-value="emit('update:timeout', $event)"
    />

    <KInput
      autocomplete="off"
      data-testid="active-healthcheck-concurrency"
      :label="t('upstreams.form.fields.concurrency.label')"
      :max="ConcurrencyMaxNumber"
      :min="ConcurrencyMinNumber"
      :model-value="concurrency"
      :readonly="readonly"
      type="number"
      @update:model-value="emit('update:concurrency', $event)"
    />

    <template v-if="isHttps">
      <KInput
        autocomplete="off"
        class="margin-bottom-6"
        data-testid="active-healthcheck-https-sni"
        :label="t('upstreams.form.fields.https_sni.label')"
        :model-value="httpsSni"
        :readonly="readonly"
        type="text"
        @update:model-value="emit('update:https-sni', $event)"
      />

      <KCheckbox
        data-testid="active-healthcheck-verify-ssl"
        :disabled="readonly"
        :label="t('upstreams.form.fields.verify_ssl.label')"
        :model-value="verifySsl"
        @update:model-value="emit('update:verify-ssl', $event)"
      />
    </template>

    <div>
      <KLabel
        :info="t('upstreams.form.fields.headers.tooltip_active')"
        :tooltip-attributes="{ maxWidth: '250px' }"
      >
        {{ t('upstreams.form.fields.headers.label') }}
      </KLabel>

      <div>
        <div
          v-for="(item, i) in localHeaders"
          :key="`${(item as any).header}_${i}`"
          class="headers-row"
          :class="{ 'margin-top-6': i > 0 }"
        >
          <KInput
            v-model="localHeaders[i].key"
            autocomplete="off"
            :data-testid="`active-healthcheck-headers-header-${i + 1}`"
            :readonly="readonly"
            type="text"
            @blur="emitHeaders"
          />
          <KInput
            v-model="localHeaders[i].values"
            autocomplete="off"
            :data-testid="`active-healthcheck-headers-value-${i + 1}`"
            :readonly="readonly"
            type="text"
            @blur="emitHeaders"
          />
          <KButton
            appearance="tertiary"
            class="btn-remove"
            data-testid="btn-remove-header"
            :disabled="localHeaders.length === 1"
            icon
            @click="removeHeader(i)"
          >
            <TrashIcon
              class="delete-item"
              :color="localHeaders.length > 1 ? KUI_COLOR_TEXT_DANGER : undefined"
            />
          </KButton>
          <KButton
            v-if="localHeaders && i === localHeaders.length - 1"
            appearance="tertiary"
            class="btn-add-header"
            data-testid="btn-add-header"
            icon
            @click="addHeader"
          >
            <AddIcon />
          </KButton>
        </div>
      </div>
    </div>

    <KCard>
      <h5 class="fields-group-title">
        {{ t('upstreams.form.healthy.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.healthy.help') }}
      </p>

      <KInput
        autocomplete="off"
        class="margin-bottom-6"
        data-testid="active-healthcheck-healthy-interval"
        :help="t('upstreams.form.fields.interval.help')"
        :label="t('upstreams.form.fields.interval.label')"
        :max="IntervalMaxNumber"
        :min="IntervalMinNumber"
        :model-value="healthyInterval"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:healthy-interval', $event)"
      />

      <KInput
        autocomplete="off"
        data-testid="active-healthcheck-healthy-successes"
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
        autocomplete="off"
        class="margin-top-6 active-healthcheck-healthy-http-statuses"
        data-testid="active-healthcheck-healthy-http-statuses"
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
        {{ t('upstreams.form.unhealthy.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.unhealthy.help') }}
      </p>

      <KInput
        autocomplete="off"
        class="margin-bottom-6"
        data-testid="active-healthcheck-unhealthy-interval"
        :help="t('upstreams.form.fields.interval.help')"
        :label="t('upstreams.form.fields.interval.label')"
        :max="IntervalMaxNumber"
        :min="IntervalMinNumber"
        :model-value="unhealthyInterval"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:unhealthy-interval', $event)"
      />

      <KInput
        autocomplete="off"
        class="margin-bottom-6"
        data-testid="active-healthcheck-unhealthy-tcp-failures"
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
        class="margin-bottom-6"
        data-testid="active-healthcheck-unhealthy-http-failures"
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
        class="margin-bottom-6 active-healthcheck-unhealthy-http-statuses"
        data-testid="active-healthcheck-unhealthy-http-statuses"
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

      <KInput
        autocomplete="off"
        data-testid="active-healthcheck-unhealthy-timeouts"
        :label="t('upstreams.form.fields.timeouts.label')"
        :max="TimeoutsMaxNumber"
        :min="TimeoutsMinNumber"
        :model-value="unhealthyTimeouts"
        :readonly="readonly"
        type="number"
        @update:model-value="emit('update:unhealthy-timeouts', $event)"
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
import type {
  ActiveHealthCheckHeader,
  HealthCheckType,
  HealthCheckTypeSelectItem, KongManagerUpstreamsFormConfig,
  KonnectUpstreamsFormConfig,
} from '../types'
import useMultiselectCreation from '../composables/useMultiselectCreation'
import {
  ActiveHealthyHttpStatuses,
  ActiveUnhealthyHttpStatuses,
  HTTPStatuses,
  SuccessOrFailureMaxNumber,
  SuccessOrFailureMinNumber,
  TimeoutsMaxNumber,
  TimeoutsMinNumber,
  TimeoutMaxNumber,
  TimeoutMinNumber,
  IntervalMaxNumber,
  IntervalMinNumber,
  ConcurrencyMaxNumber,
  ConcurrencyMinNumber,
} from '../constants'

import type { MultiselectItem, SelectItem } from '@kong/kongponents'
import useHelpers from '../composables/useHelpers'
import links from '../links'
import { AddIcon, TrashIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_DANGER } from '@kong/design-tokens'

const { i18n: { t } } = composables.useI18n()
const { objectsAreEqual } = useHelpers()

const props = defineProps({
  config: {
    type: Object as PropType<KonnectUpstreamsFormConfig | KongManagerUpstreamsFormConfig>,
    required: true,
  },
  type: {
    type: String as PropType<HealthCheckType>,
    required: true,
  },
  httpPath: {
    type: String,
    required: true,
  },
  timeout: {
    type: String,
    required: true,
  },
  concurrency: {
    type: String,
    required: true,
  },
  httpsSni: {
    type: String,
    required: true,
  },
  verifySsl: {
    type: Boolean,
    required: true,
  },
  headers: {
    type: Array as PropType<ActiveHealthCheckHeader[]>,
    required: true,
  },
  healthyInterval: {
    type: String,
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
  unhealthyInterval: {
    type: String,
    required: true,
  },
  unhealthyHttpFailures: {
    type: String,
    required: true,
  },
  unhealthyTcpFailures: {
    type: String,
    required: true,
  },
  unhealthyHttpStatuses: {
    type: Array as PropType<string[]>,
    required: true,
  },
  unhealthyTimeouts: {
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
  (e: 'update:http-path', val: string): void
  (e: 'update:timeout', val: string): void
  (e: 'update:concurrency', val: string): void
  (e: 'update:https-sni', val: string): void
  (e: 'update:verify-ssl', val: boolean): void
  (e: 'update:headers', val: ActiveHealthCheckHeader[]): void
  (e: 'update:healthy-interval', val: string): void
  (e: 'update:healthy-successes', val: string): void
  (e: 'update:healthy-http-statuses', val: string[]): void
  (e: 'update:unhealthy-interval', val: string): void
  (e: 'update:unhealthy-http-failures', val: string): void
  (e: 'update:unhealthy-tcp-failures', val: string): void
  (e: 'update:unhealthy-http-statuses', val: string[]): void
  (e: 'update:unhealthy-timeouts', val: string): void
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

const isHttps = computed((): boolean => props.type === 'https' || props.type === 'grpcs')
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
  // clear httpsSni and verifySsl values if type !== 'https' || 'grpcs'
  if ((oldVal === 'https' || oldVal === 'grpcs') && val !== oldVal) {
    emit('update:https-sni', '')
    emit('update:verify-ssl', false)
  }
  // clear httpPath value if type === 'tcp'
  if (oldVal !== 'tcp' && val === 'tcp') {
    emit('update:http-path', '/')
    emit('update:healthy-http-statuses', ActiveHealthyHttpStatuses)
    emit('update:unhealthy-http-statuses', ActiveUnhealthyHttpStatuses)
  }
})

const localHeaders = ref<ActiveHealthCheckHeader[]>([{ key: '', values: '' }])

watch(() => props.headers, (val) => {
  if (!objectsAreEqual(localHeaders.value, val)) {
    localHeaders.value = [...val]
  }
}, {
  immediate: true,
  deep: true,
})

const emitHeaders = (): void => {
  emit('update:headers', localHeaders.value)
}

const addHeader = (): void => {
  localHeaders.value.push({ key: '', values: '' })
  emitHeaders()
}

const removeHeader = (i: number): void => {
  if (i === 0 && localHeaders.value.length === 1) {
    localHeaders.value[0] = { key: '', values: '' }
  } else {
    localHeaders.value.splice(i, 1)
  }
  emitHeaders()
}
</script>

<style scoped lang="scss">
.margin-bottom-6 {
  margin-bottom: var(--kui-space-80, $kui-space-80);
}

.margin-top-6 {
  margin-top: var(--kui-space-80, $kui-space-80);
}

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

.headers-row {
  align-items: center;
  column-gap: var(--kui-space-60, $kui-space-60);
  display: flex;
}
</style>

<template>
  <EntityFormSection
    class="kong-ui-entities-upstreams-load-balancing"
    :title="t('upstreams.form.load_balancing.title')"
  >
    <template #description>
      <p>
        {{ t('upstreams.form.load_balancing.help') }}
        <KExternalLink
          hide-icon
          :href="links.upstreamObject"
        >
          {{ t('upstreams.form.buttons.view_documentation') }}
        </KExternalLink>
      </p>
    </template>

    <KSelect
      class="algorithm-select"
      :items="(algorithmItems as SelectItem[])"
      :label="t('upstreams.form.fields.algorithm.label')"
      :model-value="algorithm"
      :readonly="readonly"
      width="100%"
      @update:model-value="emit('update:algorithm', $event as UpstreamAlgorithm)"
    />

    <template
      v-if="algorithm === 'sticky-sessions'"
    >
      <KInput
        autocomplete="off"
        data-testid="upstreams-form-sticky-sessions-cookie"
        :label="t('upstreams.form.fields.sticky_sessions_cookie.label')"
        :label-attributes="{
          info: t('upstreams.form.fields.sticky_sessions_cookie.tooltip'),
          tooltipAttributes: { maxWidth: '400' },
        }"
        :model-value="stickySessionsCookie"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:sticky-sessions-cookie', $event)"
      />

      <KInput
        autocomplete="off"
        data-testid="upstreams-form-sticky-sessions-cookie-path"
        :label="t('upstreams.form.fields.sticky_sessions_cookie_path.label')"
        :label-attributes="{
          info: t('upstreams.form.fields.sticky_sessions_cookie_path.tooltip'),
          tooltipAttributes: { maxWidth: '400' },
        }"
        :model-value="stickySessionsCookiePath"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:sticky-sessions-cookie-path', $event)"
      />
    </template>

    <KInput
      v-if="algorithm !== 'sticky-sessions'"
      autocomplete="off"
      data-testid="upstreams-form-slots"
      :error="!!slotsError"
      :error-message="slotsError"
      :help="t('upstreams.form.fields.slots.help')"
      :label="t('upstreams.form.fields.slots.label')"
      :max="SlotsMaxNumber"
      :min="SlotsMinNumber"
      :model-value="slots"
      :readonly="readonly"
      type="number"
      @update:model-value="emit('update:slots', $event)"
    />

    <KCard v-if="algorithm !== 'sticky-sessions'">
      <h5 class="fields-group-title">
        {{ t('upstreams.form.fields.hash_on.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.fields.hash_on.help') }}
      </p>

      <KSelect
        class="hash-on-select"
        :items="(hashItems as SelectItem[])"
        :label="t('upstreams.form.fields.hash_on.label')"
        :model-value="hashOn"
        :readonly="readonly"
        width="100%"
        @update:model-value="emit('update:hash-on', $event as UpstreamHash)"
      />

      <KInput
        v-if="hashOn === 'header'"
        autocomplete="off"
        class="margin-top-6"
        data-testid="upstreams-form-hash-on-header"
        :label="t('upstreams.form.fields.header.label')"
        :model-value="hashOnHeader"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:hash-on-header', $event)"
      />

      <template v-if="hashOn === 'cookie'">
        <KInput
          autocomplete="off"
          class="margin-top-6"
          data-testid="upstreams-form-hash-on-cookie"
          :label="t('upstreams.form.fields.cookie.label')"
          :model-value="hashOnCookie"
          :readonly="readonly"
          required
          type="text"
          @update:model-value="emit('update:hash-on-cookie', $event)"
        />
        <KInput
          autocomplete="off"
          class="margin-top-6"
          data-testid="upstreams-form-hash-on-cookie-path"
          :label="t('upstreams.form.fields.cookie_path.label')"
          :model-value="hashOnCookiePath"
          :readonly="readonly"
          required
          type="text"
          @update:model-value="emit('update:hash-on-cookie-path', $event)"
        />
      </template>

      <KInput
        v-if="hashOn === 'query_arg'"
        autocomplete="off"
        class="margin-top-6"
        data-testid="upstreams-form-query-argument"
        :label="t('upstreams.form.fields.query_argument.label')"
        :model-value="hashOnQueryArgument"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:hash-on-query-argument', $event)"
      />

      <KInput
        v-if="hashOn === 'uri_capture'"
        autocomplete="off"
        class="margin-top-6"
        data-testid="upstreams-form-uri-capture"
        :label="t('upstreams.form.fields.uri_capture.label')"
        :model-value="hashOnUriCapture"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:hash-on-uri-capture', $event)"
      />
    </KCard>

    <KCard v-if="algorithm !== 'sticky-sessions'">
      <h5 class="fields-group-title">
        {{ t('upstreams.form.fields.hash_fallback.label') }}
      </h5>
      <p class="fields-group-text">
        {{ t('upstreams.form.fields.hash_fallback.help') }}
      </p>

      <KSelect
        class="hash-fallback-select"
        :disabled="disableFallbackSelect"
        :items="(hashItems as SelectItem[])"
        :label="t('upstreams.form.fields.hash_fallback.label')"
        :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
        :model-value="hashFallback"
        :readonly="readonly"
        width="100%"
        @update:model-value="emit('update:hash-fallback', $event as UpstreamHash)"
      >
        <template #label-tooltip>
          <i18nT
            keypath="upstreams.form.fields.hash_fallback.tooltip"
            scope="global"
          >
            <template #hash_on>
              <code>{{ t('upstreams.form.fields.hash_fallback.hash_on') }}</code>
            </template>
            <template #cookie>
              <code>{{ t('upstreams.form.fields.hash_fallback.cookie') }}</code>
            </template>
          </i18nT>
        </template>
      </KSelect>

      <KInput
        v-if="hashFallback === 'header'"
        autocomplete="off"
        class="margin-top-6"
        data-testid="upstreams-form-hash-fallback-header"
        :label="t('upstreams.form.fields.header.label')"
        :model-value="hashFallbackHeader"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:hash-fallback-header', $event)"
      />

      <template v-if="hashFallback === 'cookie'">
        <KInput
          autocomplete="off"
          class="margin-top-6"
          data-testid="upstreams-form-hash-on-cookie"
          :label="t('upstreams.form.fields.cookie.label')"
          :model-value="hashOnCookie"
          :readonly="readonly"
          required
          type="text"
          @update:model-value="emit('update:hash-on-cookie', $event)"
        />
        <KInput
          autocomplete="off"
          class="margin-top-6"
          data-testid="upstreams-form-hash-on-cookie-path"
          :label="t('upstreams.form.fields.cookie_path.label')"
          :model-value="hashOnCookiePath"
          :readonly="readonly"
          required
          type="text"
          @update:model-value="emit('update:hash-on-cookie-path', $event)"
        />
      </template>

      <KInput
        v-if="hashFallback === 'query_arg'"
        autocomplete="off"
        class="margin-top-6"
        data-testid="upstreams-form-hash-fallback-query-argument"
        :label="t('upstreams.form.fields.query_argument.label')"
        :model-value="hashFallbackQueryArgument"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:hash-fallback-query-argument', $event)"
      />

      <KInput
        v-if="hashFallback === 'uri_capture'"
        autocomplete="off"
        class="margin-top-6"
        data-testid="upstreams-form-hash-fallback-uri-capture"
        :label="t('upstreams.form.fields.uri_capture.label')"
        :model-value="hashFallbackUriCapture"
        :readonly="readonly"
        required
        type="text"
        @update:model-value="emit('update:hash-fallback-uri-capture', $event)"
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
import type { AlgorithmSelectItem, HashSelectItem, UpstreamAlgorithm, UpstreamHash } from '../types'
import useHelpers from '../composables/useHelpers'
import { SlotsMaxNumber, SlotsMinNumber } from '../constants'
import links from '../links'
import type { SelectItem } from '@kong/kongponents'
const { i18nT, i18n: { t } } = composables.useI18n()
const { inRange } = useHelpers()

const props = defineProps({
  stickySessionsAvailable: {
    type: Boolean,
    required: false,
    default: false,
  },
  algorithm: {
    type: String as PropType<UpstreamAlgorithm>,
    required: true,
  },
  stickySessionsCookie: {
    type: String,
    required: true,
  },
  stickySessionsCookiePath: {
    type: String,
    required: true,
  },
  slots: {
    type: String,
    required: true,
  },
  hashOn: {
    type: String as PropType<UpstreamHash>,
    required: true,
  },
  hashFallback: {
    type: String as PropType<UpstreamHash>,
    required: true,
  },
  hashOnHeader: {
    type: String,
    required: true,
  },
  hashOnCookie: {
    type: String,
    required: true,
  },
  hashOnCookiePath: {
    type: String,
    required: true,
  },
  hashOnQueryArgument: {
    type: String,
    required: true,
  },
  hashOnUriCapture: {
    type: String,
    required: true,
  },
  hashFallbackHeader: {
    type: String,
    required: true,
  },
  hashFallbackQueryArgument: {
    type: String,
    required: true,
  },
  hashFallbackUriCapture: {
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
  (e: 'update:algorithm', val: UpstreamAlgorithm): void
  (e: 'update:sticky-sessions-cookie', val: string): void
  (e: 'update:sticky-sessions-cookie-path', val: string): void
  (e: 'update:slots', val: string): void
  (e: 'update:hash-on', val: UpstreamHash): void
  (e: 'update:hash-fallback', val: UpstreamHash): void
  (e: 'update:hash-on-header', val: string): void
  (e: 'update:hash-on-cookie', val: string): void
  (e: 'update:hash-on-cookie-path', val: string): void
  (e: 'update:hash-on-query-argument', val: string): void
  (e: 'update:hash-on-uri-capture', val: string): void
  (e: 'update:hash-fallback-header', val: string): void
  (e: 'update:hash-fallback-query-argument', val: string): void
  (e: 'update:hash-fallback-uri-capture', val: string): void
}>()

const algorithmItems = ref<AlgorithmSelectItem[]>([
  {
    label: t('upstreams.form.algorithms.round_robin_label'),
    value: 'round-robin',
    selected: false,
  },
  {
    label: t('upstreams.form.algorithms.least_connections_label'),
    value: 'least-connections',
    selected: false,
  },
  {
    label: t('upstreams.form.algorithms.consistent_hashing_label'),
    value: 'consistent-hashing',
    selected: false,
  },
  {
    label: t('upstreams.form.algorithms.latency_label'),
    value: 'latency',
    selected: false,
  },
  ...(
    props.stickySessionsAvailable
      ? [{
        label: t('upstreams.form.algorithms.sticky_sessions_label'),
        value: 'sticky-sessions' as UpstreamAlgorithm,
        selected: false,
      }]
      : []
  ),
])

const hashItems = ref<HashSelectItem[]>([
  {
    label: t('upstreams.form.hash_labels.none'),
    value: 'none',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.consumer'),
    value: 'consumer',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.ip'),
    value: 'ip',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.header'),
    value: 'header',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.cookie'),
    value: 'cookie',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.path'),
    value: 'path',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.query_argument'),
    value: 'query_arg',
    selected: false,
  },
  {
    label: t('upstreams.form.hash_labels.uri_capture'),
    value: 'uri_capture',
    selected: false,
  },
])

watch(() => props.hashOn, (val, oldVal) => {
  // clear hashOnHeader value if hashOn !== 'header'
  if (oldVal === 'header' && val !== oldVal) {
    emit('update:hash-on-header', '')
  }
  // clear hashOnCookie and hashOnCookiePath values if hashOn !== 'cookie'
  if (oldVal === 'cookie' && val !== oldVal) {
    emit('update:hash-on-cookie', '')
    emit('update:hash-on-cookie-path', '/')
  }
  // clear hashOnQueryArgument value if hashOn !== 'query_argument'
  if (oldVal === 'query_arg' && val !== oldVal) {
    emit('update:hash-on-query-argument', '')
  }
  // clear hashOnURICapture value if hashOn !== 'uri_capture'
  if (oldVal === 'uri_capture' && val !== oldVal) {
    emit('update:hash-on-uri-capture', '')
  }
  // clear hashFallback and set default values if hashOn === 'cookie' or 'none'
  if (val === 'cookie' || val === 'none') {
    emit('update:hash-fallback', 'none')
    emit('update:hash-fallback-header', '')
    emit('update:hash-fallback-query-argument', '')
    emit('update:hash-fallback-uri-capture', '')
  }
})

watch(() => props.hashFallback, (val, oldVal) => {
  // clear hashFallbackHeader value if hashFallback !== 'header'
  if (oldVal === 'header' && val !== oldVal) {
    emit('update:hash-fallback-header', '')
  }
  // clear hashOnCookie and hashOnCookiePath values if hashFallback !== 'cookie'
  if (oldVal === 'cookie' && val !== oldVal) {
    emit('update:hash-on-cookie', '')
    emit('update:hash-on-cookie-path', '/')
  }
  // clear hashFallbackQueryArgument value if hashFallback !== 'query_argument'
  if (oldVal === 'query_arg' && val !== oldVal) {
    emit('update:hash-fallback-query-argument', '')
  }
  // clear hashFallbackURICapture value if hashFallback !== 'uri_capture'
  if (oldVal === 'uri_capture' && val !== oldVal) {
    emit('update:hash-fallback-uri-capture', '')
  }
})

watch(() => props.algorithm, (val) => {
  if (val === 'sticky-sessions') {
    emit('update:slots', '10000') // Default value for slots
    emit('update:hash-on', 'none')
    emit('update:hash-fallback', 'none')
    emit('update:hash-on-header', '')
    emit('update:hash-on-cookie', '')
    emit('update:hash-on-cookie-path', '/')
    emit('update:hash-on-query-argument', '')
    emit('update:hash-on-uri-capture', '')
    emit('update:hash-fallback-header', '')
    emit('update:hash-fallback-query-argument', '')
    emit('update:hash-fallback-uri-capture', '')
  }
}, { immediate: true })

const disableFallbackSelect = computed((): boolean => props.hashOn === 'cookie' || props.hashOn === 'none')

const slotsError = computed((): string => {
  if (props.slots) {
    if (!inRange(props.slots, SlotsMinNumber, SlotsMaxNumber)) {
      return t('upstreams.form.errors.in_range')
    }
    return ''
  } else {
    return ''
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

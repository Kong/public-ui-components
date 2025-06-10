<template>
  <div class="request-info">
    <KSkeleton
      v-if="showSkeleton"
      :table-columns="2"
      :table-rows="8"
      type="table"
    />

    <template v-else>
      <div class="title">
        {{ t('request_info.title') }}
      </div>

      <div class="attributes">
        <template
          v-for="row in rows"
          :key="row.key"
        >
          <ConfigCardItem
            :item="{
              type: ConfigurationSchemaType.Text,
              key: row.key,
              label: te(`request_info.attributes.${row.key}` as TranslationKey) ? t(`request_info.attributes.${row.key}` as TranslationKey) : row.key,
              value: row.value
            }"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ConfigCardItem, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import composables from '../../composables'
import type { TranslationKey } from '../../composables/useI18n'
import { SPAN_ATTRIBUTE_KEYS, WATERFALL_ROW_COLUMN_GAP } from '../../constants'
import type { SpanNode } from '../../types'
import { computed } from 'vue'
import { formatLatency, formatNanoDateTimeString } from '../../utils'

const { i18n: { t, te } } = composables.useI18n()

const props = defineProps<{
  rootSpan: SpanNode
  showSkeleton?: boolean
}>()

const rows = computed(() => {
  let statusCode: number | null = null
  let upstreamStatusCode: number | null = null
  let latencyMs: number | null = null

  const attrs = props.rootSpan.span.attributes as unknown as Record<string, unknown>

  if (attrs) {
    if (attrs[SPAN_ATTRIBUTE_KEYS.HTTP_RESPONSE_STATUS_CODE]) {
      statusCode = attrs[SPAN_ATTRIBUTE_KEYS.HTTP_RESPONSE_STATUS_CODE] as number
    }
    if (attrs[SPAN_ATTRIBUTE_KEYS.KONG_UPSTREAM_STATUS_CODE]) {
      upstreamStatusCode = attrs[SPAN_ATTRIBUTE_KEYS.KONG_UPSTREAM_STATUS_CODE] as number
    }
    if (attrs[SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL]) {
      latencyMs = attrs[SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL] as number
    }
  }

  const startTimeUnixNano = props.rootSpan.span.start_time_unix_nano

  return [{
    key: 'latency',
    value: latencyMs ? formatLatency(latencyMs) : t('request_info.not_available'),
  },{
    key: 'status_code',
    value: statusCode ?? t('request_info.not_available'),
  }, {
    key: 'upstream_status_code',
    value: upstreamStatusCode ?? t('request_info.not_available'),
  }, {
    key: 'start_time',
    value: startTimeUnixNano ? formatNanoDateTimeString(startTimeUnixNano) : t('request_info.not_available'),
  }]
})
</script>

<style lang="scss" scoped>
.request-info {
  align-items: flex-start;
  display: flex;
  flex-direction: column;

  .title {
    background-color: $kui-color-background-neutral-weakest;
    border-bottom: 1px solid $kui-color-border-neutral-weaker;
    box-sizing: border-box;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-40 v-bind(WATERFALL_ROW_COLUMN_GAP);
    width: 100%;
  }

  .attributes {
    width: 100%;

    :deep(.config-card-details-value) {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-30;

      .copy-text {
        font-size: $kui-font-size-30;
      }
    }

    :deep(.config-card-details-row) {
      column-gap: v-bind(WATERFALL_ROW_COLUMN_GAP);
      display: grid;
      grid-template-columns: 1fr 2fr;
      padding: $kui-space-40 v-bind(WATERFALL_ROW_COLUMN_GAP);

      .config-card-details-label,
      .config-card-details-value {
        padding: 0;
        width: 100%;
      }
    }
  }
}
</style>

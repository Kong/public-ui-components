<template>
  <div
    v-if="latencies.length > 0"
    class="span-latency-table"
  >
    <div class="title">
      {{ t('trace_viewer.latency.section_title') }}
    </div>

    <div class="latencies">
      <ConfigCardItem
        v-for="latency in latencies"
        :key="latency.key"
        :item="{
          type: ConfigurationSchemaType.Text,
          key: latency.key,
          label: latency.labelKey ? t(latency.labelKey) : latency.key,
          value: formatLatency(latency.milliseconds),
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ConfigCardItem, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import { computed } from 'vue'
import composables from '../../composables'
import { WATERFALL_ROW_PADDING_X } from '../../constants'
import type { SpanNode } from '../../types'
import { formatLatency, toSpanLatencies } from '../../utils'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{ span: SpanNode['span'] }>()

const latencies = computed(() => toSpanLatencies(props.span.attributes))
</script>

<style lang="scss" scoped>
.span-latency-table {
  align-items: flex-start;
  display: flex;
  flex-direction: column;

  .title {
    background-color: $kui-color-background-neutral-weakest;
    border-bottom: 1px solid $kui-color-border-neutral-weaker;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-60 v-bind(WATERFALL_ROW_PADDING_X);
    width: 100%;
  }

  .latencies {
    width: 100%;

    :deep(.config-card-details-value) {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-30;

      .copy-text {
        font-size: $kui-font-size-30;
      }
    }
  }
}
</style>

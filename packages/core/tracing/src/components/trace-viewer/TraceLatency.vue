<template>
  <div class="trace-latency">
    <div class="title">
      {{ t('trace_viewer.latency.label') }}
    </div>

    <div
      v-for="latency in latencies"
      :key="latency.key"
      class="latency"
    >
      {{ latency.labelKey ? t(latency.labelKey) : latency.key }}: {{ formatLatency(latency.milliseconds) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'
import type { SpanNode } from '../../types'
import { formatLatency, toOverviewLatencies } from '../../utils'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{ span: SpanNode['span'] }>()

const latencies = computed(() => toOverviewLatencies(props.span.attributes))
</script>

<style lang="scss" scoped>
.trace-latency {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-shrink: 0;
  font-size: $kui-font-size-30;
  gap: $kui-space-40;
  justify-content: flex-start;

  .title {
    font-weight: $kui-font-weight-semibold;
  }
}
</style>

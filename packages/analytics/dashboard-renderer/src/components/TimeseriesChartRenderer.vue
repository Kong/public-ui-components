<!-- TimeseriesChartRenderer.vue -->
<template>
  <BaseAnalyticsChartRenderer
    :chart-options="chartOptions"
    :context="context"
    :explore-link="exploreLink"
    :height="height"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    :requests-link="requestsLink"
    @select-chart-range="emit('select-chart-range', $event)"
    @zoom-time-range="emit('zoom-time-range', $event)"
  />
</template>

<script setup lang="ts">
import BaseAnalyticsChartRenderer from './BaseAnalyticsChartRenderer.vue'
import type { RendererProps } from '../types'
import type { AbsoluteTimeRangeV4, TimeseriesChartOptions } from '@kong-ui-public/analytics-utilities'

defineProps<RendererProps<TimeseriesChartOptions>>()
const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()
</script>

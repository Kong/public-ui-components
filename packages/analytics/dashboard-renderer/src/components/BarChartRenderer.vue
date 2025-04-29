<!-- BarChartRenderer.vue -->
<template>
  <BaseAnalyticsChartRenderer
    :chart-options="chartOptions"
    :context="context"
    :extra-props="{ showAnnotations: false, timeseriesZoom: context.timeseriesZoom }"
    :height="height"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  />
</template>

<script setup lang="ts">
import BaseAnalyticsChartRenderer from './BaseAnalyticsChartRenderer.vue'
import type { RendererProps } from '../types'
import type { BarChartOptions } from '@kong-ui-public/analytics-utilities'

defineProps<RendererProps<BarChartOptions>>()
</script>

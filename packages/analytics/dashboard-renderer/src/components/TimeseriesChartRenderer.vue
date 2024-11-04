<!-- TimeseriesChartRenderer.vue -->
<template>
  <BaseAnalyticsChartRenderer
    :chart-options="chartOptions"
    :context="context"
    :height="height"
    :query="query"
    :query-ready="queryReady"
  />
</template>

<script setup lang="ts">
import BaseAnalyticsChartRenderer from './BaseAnalyticsChartRenderer.vue'
import type { TimeseriesChartOptions, RendererProps } from '../types'

defineProps<RendererProps<TimeseriesChartOptions>>()
</script>

<template>
  <BaseAnalyticsChartRenderer
    :chart-options="chartOptions"
    :context="context"
    :height="height"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  />
</template>

<script setup lang="ts">
import BaseAnalyticsChartRenderer from './BaseAnalyticsChartRenderer.vue'
import type { RendererProps } from '../types'
import type { DonutChartOptions } from '@kong-ui-public/analytics-utilities'

defineProps<RendererProps<DonutChartOptions>>()
</script>

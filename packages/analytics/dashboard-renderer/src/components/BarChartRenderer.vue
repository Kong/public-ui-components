<!-- BarChartRenderer.vue -->
<template>
  <BaseAnalyticsChartRenderer
    :chart-options="chartOptions"
    :context="context"
    :editable="context.editable"
    :extra-props="{ showAnnotations: false }"
    :height="height"
    :query="query"
    :query-ready="queryReady"
  />
</template>

<script setup lang="ts">
import BaseAnalyticsChartRenderer from './BaseAnalyticsChartRenderer.vue'
import type { BarChartOptions, RendererProps } from '../types'

defineProps<RendererProps<BarChartOptions>>()
</script>

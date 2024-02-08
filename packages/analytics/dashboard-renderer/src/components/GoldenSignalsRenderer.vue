<template>
  <MetricsProviderInternal v-bind="options">
    <MetricsConsumer />
  </MetricsProviderInternal>
</template>
<script setup lang="ts">
import type { MetricCardOptions, RendererProps } from '../types'
import { MetricsProviderInternal, MetricsConsumer } from '@kong-ui-public/analytics-metric-provider'
import { computed } from 'vue'

// Unlike AnalyticsChart, the metric card package doesn't currently expose its options
// in a convenient interface.
type ProviderProps = InstanceType<typeof MetricsProviderInternal>['$props']

const props = defineProps<RendererProps<MetricCardOptions>>()

const options = computed<ProviderProps>(() => ({
  longCardTitles: props.chartOptions.longCardTitles,
  description: props.chartOptions.description,
  hasTrendAccess: true,
  refreshInterval: 0,
}))
</script>

<template>
  <QueryDataProvider
    v-slot="{ data }"
    :query="query"
    :query-ready="queryReady"
  >
    <AnalyticsChart
      :chart-data="data"
      :chart-options="options"
      chart-title=""
      :height="`${height}px`"
      legend-position="bottom"
      tooltip-title=""
    />
  </QueryDataProvider>
</template>
<script setup lang="ts">
import type { BarChartOptions, RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import { AnalyticsChart, ChartTypes as AnalyticsChartTypes } from '@kong-ui-public/analytics-chart'
import { ChartTypes } from '../types'

const props = defineProps<RendererProps<BarChartOptions>>()

const chartTypeLookup = {
  [ChartTypes.HorizontalBar]: AnalyticsChartTypes.HORIZONTAL_BAR,
  [ChartTypes.VerticalBar]: AnalyticsChartTypes.VERTICAL_BAR,
  [ChartTypes.TimeseriesLine]: AnalyticsChartTypes.TIMESERIES_LINE,
}

const options = computed(() => ({
  type: chartTypeLookup[props.chartOptions.type],
}))
</script>

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
import type { RendererProps, TimeseriesChartOptions } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'
import { AnalyticsChart, ChartTypes as AnalyticsChartTypes } from '@kong-ui-public/analytics-chart'
import { ChartTypes } from '../types'

const props = defineProps<RendererProps<TimeseriesChartOptions>>()

const chartTypeLookup = {
  [ChartTypes.TimeseriesLine]: AnalyticsChartTypes.TIMESERIES_LINE,
  // TODO: Timeseries bar
}

const options = computed<AnalyticsChartOptions>(() => ({
  type: chartTypeLookup[props.chartOptions.type],
  fill: props.chartOptions.fill,
  stacked: props.chartOptions.stacked,
  chartDatasetColors: props.chartOptions.chartDatasetColors,
}))
</script>

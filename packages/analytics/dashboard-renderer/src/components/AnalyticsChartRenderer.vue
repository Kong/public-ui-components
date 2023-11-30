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
      :show-annotations="(chartOptions as BarChartOptions).showAnnotations"
      tooltip-title=""
    />
  </QueryDataProvider>
</template>
<script setup lang="ts">
import type { BarChartOptions, RendererProps, TimeseriesChartOptions } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'
import { AnalyticsChart, ChartTypes as AnalyticsChartTypes } from '@kong-ui-public/analytics-chart'
import { ChartTypes } from '../types'

const props = defineProps<RendererProps<BarChartOptions | TimeseriesChartOptions>>()

const chartTypeLookup = {
  [ChartTypes.HorizontalBar]: AnalyticsChartTypes.HORIZONTAL_BAR,
  [ChartTypes.VerticalBar]: AnalyticsChartTypes.VERTICAL_BAR,
  [ChartTypes.TimeseriesLine]: AnalyticsChartTypes.TIMESERIES_LINE,
}

const options = computed<AnalyticsChartOptions>(() => ({
  type: chartTypeLookup[props.chartOptions.type],
  fill: (props.chartOptions as TimeseriesChartOptions).fill,
  stacked: props.chartOptions.stacked,
}))
</script>

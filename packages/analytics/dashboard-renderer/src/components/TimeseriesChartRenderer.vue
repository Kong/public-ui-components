<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
  >
    <div class="analytics-chart">
      <AnalyticsChart
        :chart-data="data"
        :chart-options="options"
        legend-position="bottom"
        tooltip-title=""
      />
    </div>
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

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`');
}
</style>

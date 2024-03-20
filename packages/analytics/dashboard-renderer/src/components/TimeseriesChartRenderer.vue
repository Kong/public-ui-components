<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
  >
    <div class="analytics-chart">
      <AnalyticsChart
        :allow-csv-export="chartOptions.allowCsvExport"
        :chart-data="data"
        :chart-options="options"
        :chart-title="chartOptions.chartTitle"
        legend-position="bottom"
        :synthetics-data-key="chartOptions.syntheticsDataKey"
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

const options = computed<AnalyticsChartOptions>(() => {
  // Default `stacked` to false.
  const stacked = props.chartOptions.stacked ?? false

  // Note that `fill` and `stacked` are linked; it's not possible to have a non-filled stacked chart.
  // This matches our intuitions about how these charts work.
  return {
    type: chartTypeLookup[props.chartOptions.type],
    fill: stacked,
    stacked,
    chartDatasetColors: props.chartOptions.chartDatasetColors,
  }
})
</script>

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`');
}
</style>

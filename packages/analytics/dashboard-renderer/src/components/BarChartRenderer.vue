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
        :show-annotations="false"
        :synthetics-data-key="chartOptions.syntheticsDataKey"
        tooltip-title=""
      />
    </div>
  </QueryDataProvider>
</template>
<script setup lang="ts">
import type { BarChartOptions, RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'
import { AnalyticsChart, ChartTypes as AnalyticsChartTypes } from '@kong-ui-public/analytics-chart'
import { ChartTypes } from '../types'

const props = defineProps<RendererProps<BarChartOptions>>()

const chartTypeLookup = {
  [ChartTypes.HorizontalBar]: AnalyticsChartTypes.HORIZONTAL_BAR,
  [ChartTypes.VerticalBar]: AnalyticsChartTypes.VERTICAL_BAR,
}

const options = computed<AnalyticsChartOptions>(() => ({
  type: chartTypeLookup[props.chartOptions.type],
  stacked: props.chartOptions.stacked,
  chartDatasetColors: props.chartOptions.chartDatasetColors,
}))
</script>

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`');
}
</style>

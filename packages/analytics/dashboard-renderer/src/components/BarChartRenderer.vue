<template>
  <QueryDataProvider
    v-slot="{ data }"
    :query="query"
    :query-ready="queryReady"
  >
    <div class="analytics-chart">
      <AnalyticsChart
        :chart-data="data as unknown as AnalyticsExploreResult"
        :chart-options="options"
        legend-position="bottom"
        :show-annotations="chartOptions.showAnnotations"
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
import type { AnalyticsExploreResult } from '@kong-ui-public/analytics-utilities'

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
  height: v-bind('`${height}px`')
}
</style>

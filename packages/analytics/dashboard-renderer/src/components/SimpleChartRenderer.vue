<template>
  <QueryDataProvider
    v-slot="{ data }"
    :query="query"
    :query-ready="queryReady"
  >
    <div class="analytics-chart">
      <SimpleChart
        :chart-data="data as unknown as AnalyticsExploreResult"
        :chart-options="mappedChartOptions"
        :synthetics-data-key="chartOptions.syntheticsDataKey"
      />
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { GaugeChartOptions, RendererProps } from '../types'
import { computed } from 'vue'
import { SimpleChart, ChartTypesSimple } from '@kong-ui-public/analytics-chart'
import type { SimpleChartOptions } from '@kong-ui-public/analytics-chart'
import { ChartTypes } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import type { AnalyticsExploreResult } from '@kong-ui-public/analytics-utilities'

const props = defineProps<RendererProps<GaugeChartOptions>>()

const chartTypeLookup = {
  [ChartTypes.Gauge]: ChartTypesSimple.GAUGE,
}

const mappedChartOptions = computed<SimpleChartOptions>(() => ({
  ...props.chartOptions,
  type: chartTypeLookup[props.chartOptions.type],
}))

</script>

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`')
}
</style>

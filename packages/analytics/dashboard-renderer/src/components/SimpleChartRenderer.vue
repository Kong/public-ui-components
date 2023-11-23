<template>
  <QueryDataProvider
    v-slot="{ data }"
    :query="props.query"
    :query-ready="props.queryReady"
  >
    <SimpleChart
      :chart-data="data"
      :chart-options="mappedChartOptions"
      :height="`${props.height}px`"
      :synthetics-data-key="props.chartOptions.syntheticsDataKey"
    />
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { GaugeChartOptions, RendererProps } from '../types'
import { computed } from 'vue'
import { SimpleChart, ChartTypesSimple } from '@kong-ui-public/analytics-chart'
import type { SimpleChartOptions } from '@kong-ui-public/analytics-chart'
import { ChartTypes } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<RendererProps<GaugeChartOptions>>()

const chartTypeLookup = {
  [ChartTypes.Gauge]: ChartTypesSimple.GAUGE,
}

const mappedChartOptions = computed<SimpleChartOptions>(() => ({
  ...props.chartOptions,
  type: chartTypeLookup[props.chartOptions.type],
}))

</script>

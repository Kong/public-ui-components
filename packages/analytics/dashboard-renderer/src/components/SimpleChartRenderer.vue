<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  >
    <div class="analytics-chart">
      <SimpleChart
        :chart-data="data"
        :chart-options="props.chartOptions"
        :synthetics-data-key="chartOptions.syntheticsDataKey"
      />
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { GaugeChartOptions, RendererProps } from '../types'
import { SimpleChart } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<RendererProps<GaugeChartOptions>>()

</script>

<style scoped lang="scss">
.analytics-chart {
  height: v-bind('`${height}px`')
}
</style>

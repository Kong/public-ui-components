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
import type { RendererProps } from '../types'
import type { GaugeChartOptions } from '@kong-ui-public/analytics-utilities'
import { SimpleChart } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<RendererProps<GaugeChartOptions>>()

</script>

<style scoped lang="scss">
.analytics-chart {
  display: flex;
  flex-direction: column;
  height: v-bind('`${height}px`');
  justify-content: center;
}
</style>

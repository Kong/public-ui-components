<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  >
    <div
      class="analytics-chart"
      :class="{ 'single-value': isSingleValueChart }"
    >
      <SimpleChart
        :chart-data="data"
        :chart-options="chartOptions"
        :synthetics-data-key="isSingleValueChart ? undefined : (chartOptions as GaugeChartOptions).synthetics_data_key"
      />
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import type { GaugeChartOptions, SingleValueOptions } from '@kong-ui-public/analytics-utilities'
import { SimpleChart } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'

const props = defineProps<RendererProps<GaugeChartOptions | SingleValueOptions>>()

const isSingleValueChart = computed((): boolean => props.chartOptions.type === 'single_value')

const tileHeight = computed(() => props.height || 170)
</script>

<style scoped lang="scss">
.analytics-chart {
  display: flex;
  flex-direction: column;
  height: v-bind('`${tileHeight}px`');
  justify-content: center;

  // single value chart adopts the height of the parent container
  // maximum height it can ever be is 104px in a very wide container so we don't need to set a max-height but rather let it take up the available space
  &.single-value {
    height: 100%;
  }
}
</style>

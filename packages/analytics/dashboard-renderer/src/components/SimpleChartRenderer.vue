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
      :class="{ 'single-value': isSingleValueChart, 'compact': isSingleValueChart && fitToContent }"
      :style="isSingleValueChart ? undefined : { height: `${height}px` }"
    >
      <SimpleChart
        :chart-data="data"
        :chart-options="simpleChartOptions"
        :synthetics-data-key="isSingleValueChart ? undefined : (chartOptions as GaugeChartOptions).synthetics_data_key"
      />
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { ChartRendererProps } from '../types'
import type { GaugeChartOptions, SingleValueOptions } from '@kong-ui-public/analytics-utilities'
import { SimpleChart } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'

const props = defineProps<ChartRendererProps<GaugeChartOptions | SingleValueOptions> & { fitToContent?: boolean }>()

const isSingleValueChart = computed((): boolean => props.chartOptions.type === 'single_value')

const simpleChartOptions = computed(() => props.chartOptions.type === 'single_value'
  ? {
    ...props.chartOptions,
    alignX: props.chartOptions.align_x ?? 'left',
    showTrend: props.query.granularity === 'trend',
    compact: !!props.fitToContent,
    // Without a custom title the tile header shows the metric name, this will hide the metric name below the value
    hideMetricName: !props.chartOptions.chart_title,
  }
  : props.chartOptions)
</script>

<style scoped lang="scss">
.analytics-chart {
  display: flex;
  flex-direction: column;
  justify-content: center;

  // single value chart adopts the height of the parent container
  // maximum height it can ever be is 104px in a very wide container so we don't need to set a max-height but rather let it take up the available space
  &.single-value {
    height: 100%;

    &.compact {
      justify-content: flex-start;
    }
  }
}
</style>

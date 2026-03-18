<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    @chart-data="onChartData"
  >
    <div class="analytics-chart">
      <TimeseriesChart
        v-if="timeseriesChartType"
        :color-palette="colorPalette"
        :data="data"
        :explore-link="exploreLink"
        :hide-truncation-warning="hideTruncationWarning"
        legend-position="bottom"
        :requests-link="requestsLink"
        :stacked="stacked"
        :threshold="threshold"
        :timeseries-zoom="timeseriesZoom"
        tooltip-title=""
        :type="timeseriesChartType"
        @select-chart-range="emit('select-chart-range', $event)"
        @zoom-time-range="emit('zoom-time-range', $event)"
      />
      <CrossSectionChart
        v-else-if="crossSectionChartType"
        :color-palette="colorPalette"
        :data="data"
        :hide-truncation-warning="hideTruncationWarning"
        legend-position="bottom"
        :stacked="stacked"
        tooltip-title=""
        :type="crossSectionChartType"
      />
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import { CrossSectionChart, TimeseriesChart } from '@kong-ui-public/analytics-echarts'
import type {
  AbsoluteTimeRangeV4,
  BarChartOptions,
  DonutChartOptions,
  ExploreResultV4,
  TimeseriesChartOptions,
} from '@kong-ui-public/analytics-utilities'

type EchartsChartOptions = TimeseriesChartOptions | BarChartOptions | DonutChartOptions

const props = defineProps<RendererProps<EchartsChartOptions> & { extraProps?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'edit-tile'): void
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'view-requests', timeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const timeseriesChartType = computed<TimeseriesChartOptions['type'] | null>(() => {
  return props.chartOptions.type === 'timeseries_line' || props.chartOptions.type === 'timeseries_bar'
    ? props.chartOptions.type
    : null
})

const crossSectionChartType = computed<BarChartOptions['type'] | DonutChartOptions['type'] | null>(() => {
  return props.chartOptions.type === 'horizontal_bar' || props.chartOptions.type === 'vertical_bar' || props.chartOptions.type === 'donut'
    ? props.chartOptions.type
    : null
})

const colorPalette = computed(() => {
  return 'chart_dataset_colors' in props.chartOptions ? props.chartOptions.chart_dataset_colors : undefined
})

const stacked = computed(() => {
  return !('stacked' in props.chartOptions) || props.chartOptions.stacked !== false
})

const threshold = computed(() => {
  return 'threshold' in props.chartOptions ? props.chartOptions.threshold : undefined
})

const hideTruncationWarning = computed(() => {
  return props.query.limit !== undefined && props.query.limit > 0
})

const timeseriesZoom = computed(() => props.context.zoomable)

const onChartData = (data: ExploreResultV4) => {
  emit('chart-data', data)
}
</script>

<style scoped lang="scss">
.analytics-chart {
  height: 100%;
}
</style>

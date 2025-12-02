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
        :data="data"
        :stacked="chartOptions.stacked ?? false"
        :threshold="chartOptions.threshold"
        :timeseries-zoom="timeseriesZoom"
        :type="chartOptions.type"
        @select-chart-range="emit('select-chart-range', $event)"
        @zoom-time-range="emit('zoom-time-range', $event)"
      />
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import { TimeseriesChart } from '@kong-ui-public/analytics-echarts'
import type { AbsoluteTimeRangeV4, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

const props = defineProps<RendererProps<any> & { extraProps?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'edit-tile'): void
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'view-requests', timeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

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

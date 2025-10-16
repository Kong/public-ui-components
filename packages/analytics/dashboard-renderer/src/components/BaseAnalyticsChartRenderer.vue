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
      <AnalyticsChart
        :chart-data="data"
        :chart-options="options"
        :explore-link="exploreLink"
        legend-position="bottom"
        :requests-link="requestsLink"
        :synthetics-data-key="chartOptions.synthetics_data_key"
        :timeseries-zoom="timeseriesZoom"
        tooltip-title=""
        v-bind="extraProps"
        @select-chart-range="emit('select-chart-range', $event)"
        @zoom-time-range="emit('zoom-time-range', $event)"
      >
        <template
          v-if="context.editable"
          #menu-items
        >
          <KDropdownItem @click="editTile">
            {{ i18n.t('renderer.edit') }}
          </KDropdownItem>
        </template>
      </AnalyticsChart>
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'
import { AnalyticsChart } from '@kong-ui-public/analytics-chart'
import composables from '../composables'
import type { AbsoluteTimeRangeV4, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

const props = defineProps<RendererProps<any> & { extraProps?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'edit-tile'): void
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'view-requests', timeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()
const { i18n } = composables.useI18n()

const options = computed((): AnalyticsChartOptions => ({
  type: props.chartOptions.type,
  stacked: props.chartOptions.stacked ?? false,
  chartDatasetColors: props.chartOptions.chart_dataset_colors,
  threshold: props.chartOptions.threshold,
}))

const timeseriesZoom = computed(() => props.context.zoomable)

const editTile = () => {
  emit('edit-tile')
}

const onChartData = (data: ExploreResultV4) => {
  emit('chart-data', data)
}
</script>

<style scoped lang="scss">
.analytics-chart {
  height: 100%;
}
</style>

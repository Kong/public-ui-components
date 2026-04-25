<template>
  <AnalyticsChartShell
    :empty-state-description="emptyStateDescription"
    :empty-state-title="emptyStateTitle"
    :has-valid-chart-data="hasValidChartData"
    :max-entities-shown="maxEntitiesShown"
    :result-set-truncated="resultSetTruncated"
    :show-legend-values="showLegendValues"
  >
    <div
      class="chart-parent"
      :class="chartFlexClass"
    >
      <BaseAnalyticsEcharts
        ref="baseChart"
        class="chart-container"
        :option="option"
        :render-mode="renderMode"
        :theme="theme"
        @brush="handleBrush"
        @zr:click="handleClick"
        @zr:mousedown="handleMouseDown"
        @zr:mousemove="handleMouseMove"
        @zr:mouseout="handleMouseOut"
        @zr:mouseup="handleMouseUp"
      >
        <ChartTooltip
          ref="tooltip"
          :brush-time-range="brushTimeRange"
          :granularity="timeSeriesGranularity"
          :state="tooltipState"
          :zoom-action-items="zoomActionItems"
          @on-action="resetTooltipState"
        />
      </BaseAnalyticsEcharts>
      <ChartLegend
        :items="legendItems"
        :position="legendPosition"
        :show-values="showLegendValues"
        @toggle="toggleLegendItem"
      />
    </div>
  </AnalyticsChartShell>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import {
  msToGranularity,
  type AbsoluteTimeRangeV4,
  type ExploreAggregations,
  type ExploreResultV4,
  type GranularityValues,
} from '@kong-ui-public/analytics-utilities'
import type { ElementEvent } from 'echarts/core'
import composables from '../composables'
import {
  datavisPalette,
  getGranularityAxisTitle,
  getMetricAxisTitle,
  getMetricUnit,
  getTooltipMetricDisplay,
  hasMillisecondTimestamps,
} from '../utils'
import type {
  AnalyticsChartColors,
  ChartLegendSortFn,
  ChartTooltipSortFn,
  ExternalLink,
  LegendPosition,
  Threshold,
} from '../types'
import AnalyticsChartShell from './AnalyticsChartShell.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'
import ChartLegend from './ChartLegend.vue'
import ChartTooltip from './ChartTooltip.vue'
import type { ZoomActionItem } from './ZoomActions.vue'

const {
  data,
  type,
  stacked = false,
  timeseriesZoom = false,
  requestsLink,
  exploreLink,
  threshold,
  colorPalette,
  tooltipTitle,
  emptyStateTitle,
  emptyStateDescription,
  metricAxesTitle,
  dimensionAxesTitle,
  showLegendValues = false,
  legendPosition = 'bottom',
  chartLegendSortFn,
  chartTooltipSortFn,
  hideTruncationWarning = false,
  theme = 'light',
  renderMode = 'svg',
} = defineProps<{
  data: ExploreResultV4
  type: 'timeseries_line' | 'timeseries_bar'
  stacked?: boolean
  timeseriesZoom?: boolean
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
  threshold?: Partial<Record<ExploreAggregations, Threshold[]>>
  colorPalette?: string[] | AnalyticsChartColors
  tooltipTitle?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  metricAxesTitle?: string
  dimensionAxesTitle?: string
  showLegendValues?: boolean
  legendPosition?: LegendPosition
  chartLegendSortFn?: ChartLegendSortFn
  chartTooltipSortFn?: ChartTooltipSortFn
  hideTruncationWarning?: boolean
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const { i18n } = composables.useI18n()

const timeSeriesGranularity = computed<GranularityValues>(() => {
  if (!data.meta.granularity_ms && data.data.length > 1) {
    return msToGranularity(
      new Date(data.data[1].timestamp).getTime() - new Date(data.data[0].timestamp).getTime(),
    ) || 'hourly'
  }

  return msToGranularity(data.meta.granularity_ms) || 'hourly'
})

const chartData = composables.useTimeseriesChartData({
  fill: toRef(() => stacked),
  colorPalette: computed(() => colorPalette || datavisPalette),
}, toRef(() => data))

const metricUnit = computed(() => getMetricUnit(
  data.meta?.metric_units,
  data.meta?.metric_names?.[0],
))

const { selectedLabels, toggleLegendItem } = composables.useChartLabelSelection(chartData)

const {
  chartRef,
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
  chartFlexClass,
  chartTooltipSortFn: frameChartTooltipSortFn,
  legendItems,
  maxEntitiesShown,
  resultSetTruncated,
} = composables.useChartFrame({
  data: toRef(() => data),
  chartData,
  metricUnit,
  selectedLabels,
  legendPosition: toRef(() => legendPosition),
  chartLegendSortFn: toRef(() => chartLegendSortFn),
  chartTooltipSortFn: toRef(() => chartTooltipSortFn),
  hideTruncationWarning: toRef(() => hideTruncationWarning),
})

const metricAxisTitle = computed(() => {
  return getMetricAxisTitle({
    i18n,
    metricName: data.meta?.metric_names?.[0],
    metricUnit: metricUnit.value,
    metricAxesTitle,
    metricCount: data.meta?.metric_names?.length || 0,
  })
})

const dimensionAxisTitle = computed(() => {
  return dimensionAxesTitle || getGranularityAxisTitle({
    i18n,
    granularity: timeSeriesGranularity.value,
  })
})

const tooltipMetricDisplay = computed(() => {
  return getTooltipMetricDisplay({
    i18n,
    metricName: data.meta?.metric_names?.[0],
    metricUnit: metricUnit.value,
    metricCount: data.meta?.metric_names?.length || 0,
  })
})

const hasValidChartData = computed(() => hasMillisecondTimestamps(chartData.value))

const zoomActionItems = computed<ZoomActionItem[]>(() => {
  return [
    ...(timeseriesZoom ? [{
      label: i18n.t('zoom_action_items.zoom'),
      key: 'zoom-in',
      action: (newTimeRange: AbsoluteTimeRangeV4) => emit('zoom-time-range', newTimeRange),
    }] : []),
    ...(exploreLink ? [{
      label: i18n.t('zoom_action_items.explore'),
      key: 'explore',
      href: exploreLink.href,
    }] : []),
    ...(requestsLink ? [{
      label: i18n.t('zoom_action_items.view_requests'),
      key: 'view-requests',
      href: requestsLink.href,
    }] : []),
  ]
})

const {
  isSelecting,
  brushTimeRange,
  clearBrush,
  handleMouseDown: brushMouseDown,
  handleMouseMove: brushMouseMove,
  handleMouseUp: brushMouseUp,
  handleBrush,
} = composables.useBrushZoom({
  chartRef,
  onSelectionStart: () => {
    setInteractionMode('selecting-chart-area')
  },
  onSelectionEnd: (timeRange) => {
    setInteractionMode('zoom-interactive')
    if (timeRange) {
      emit('select-chart-range', timeRange)
    }
  },
})

const {
  tooltipState,
  handleTooltipMouseMove,
  handleTooltipClick,
  handleTooltipMouseOut,
  resetTooltipState,
  setInteractionMode,
} = composables.useEchartsTooltipController({
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
  onReset: timeseriesZoom ? clearBrush : undefined,
})

const { option } = composables.useTimeseriesChartOption({
  chartData,
  chartType: toRef(() => type),
  granularity: timeSeriesGranularity,
  stacked: toRef(() => stacked),
  threshold: toRef(() => threshold),
  metricUnit,
  tooltipTitle: toRef(() => tooltipTitle),
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn: frameChartTooltipSortFn,
  tooltipState,
})

const handleMouseMove = (event: ElementEvent) => {
  if (timeseriesZoom) {
    brushMouseMove(event)
  }

  handleTooltipMouseMove(event)
}

const handleMouseDown = (event: ElementEvent) => {
  if (timeseriesZoom) {
    brushMouseDown(event)
  }
}

const handleMouseUp = (event: ElementEvent) => {
  if (timeseriesZoom) {
    brushMouseUp(event)
  }
}

const handleClick = () => {
  if (timeseriesZoom && isSelecting.value) {
    return
  }

  handleTooltipClick()
}

const handleMouseOut = () => {
  handleTooltipMouseOut()
}


</script>

<style scoped lang="scss">
@use "../styles/chart";
</style>

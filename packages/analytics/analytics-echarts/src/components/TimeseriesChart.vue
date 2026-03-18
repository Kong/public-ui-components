<template>
  <AnalyticsChartShell
    :empty-state-description="props.emptyStateDescription"
    :empty-state-title="props.emptyStateTitle"
    :has-valid-chart-data="hasValidChartData"
    :max-entities-shown="maxEntitiesShown"
    :result-set-truncated="resultSetTruncated"
    :show-legend-values="props.showLegendValues"
  >
    <div
      class="chart-parent"
      :class="chartFlexClass"
    >
      <BaseAnalyticsEcharts
        ref="baseChart"
        class="chart-container"
        :option="option"
        :render-mode="props.renderMode"
        :theme="props.theme"
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
        :position="props.legendPosition"
        :show-values="props.showLegendValues"
        @toggle="toggleLegendItem"
      />
    </div>
  </AnalyticsChartShell>
</template>

<script setup lang="ts">
import { computed, ref, toRef, useTemplateRef } from 'vue'
import {
  msToGranularity,
  type AbsoluteTimeRangeV4,
  type ExploreAggregations,
  type ExploreResultV4,
  type GranularityValues,
} from '@kong-ui-public/analytics-utilities'
import { useElementBounding, useElementSize } from '@vueuse/core'
import composables from '../composables'
import {
  createDefaultChartLegendSort,
  createDefaultChartTooltipSort,
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
  TooltipState,
} from '../types'
import AnalyticsChartShell from './AnalyticsChartShell.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'
import ChartLegend from './ChartLegend.vue'
import ChartTooltip from './ChartTooltip.vue'
import type { ZoomActionItem } from './ZoomActions.vue'

const props = withDefaults(defineProps<{
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
}>(), {
  stacked: false,
  timeseriesZoom: false,
  requestsLink: undefined,
  exploreLink: undefined,
  threshold: undefined,
  colorPalette: undefined,
  tooltipTitle: undefined,
  emptyStateTitle: undefined,
  emptyStateDescription: undefined,
  metricAxesTitle: undefined,
  dimensionAxesTitle: undefined,
  showLegendValues: false,
  legendPosition: 'bottom',
  chartLegendSortFn: undefined,
  chartTooltipSortFn: undefined,
  hideTruncationWarning: false,
  theme: 'light',
  renderMode: 'svg',
})

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const { i18n } = composables.useI18n()
const tooltipState = ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const baseChartRef = useTemplateRef('baseChart')
const tooltipRef = useTemplateRef('tooltip')

const chartRef = computed(() => baseChartRef.value?.getChart())
const containerRef = computed(() => baseChartRef.value?.getContainer())
const chartEl = computed(() => chartRef.value?.$el as HTMLElement | undefined)

const { width: chartWidth, height: chartHeight } = useElementSize(chartEl)
const { top: containerTop, left: containerLeft } = useElementBounding(containerRef)

const tooltipWidth = computed(() => tooltipRef.value?.width)
const tooltipHeight = computed(() => tooltipRef.value?.height)

const timeSeriesGranularity = computed<GranularityValues>(() => {
  if (!props.data.meta.granularity_ms && props.data.data.length > 1) {
    return msToGranularity(
      new Date(props.data.data[1].timestamp).getTime() - new Date(props.data.data[0].timestamp).getTime(),
    ) || 'hourly'
  }

  return msToGranularity(props.data.meta.granularity_ms) || 'hourly'
})

const chartData = composables.useExploreResultToTimeDatasets({
  fill: toRef(props, 'stacked'),
  colorPalette: computed(() => props.colorPalette || datavisPalette),
}, toRef(props, 'data'))

const metricUnit = computed(() => getMetricUnit(
  props.data.meta?.metric_units,
  props.data.meta?.metric_names?.[0],
))

const metricAxisTitle = computed(() => {
  return getMetricAxisTitle({
    i18n,
    metricName: props.data.meta?.metric_names?.[0],
    metricUnit: metricUnit.value,
    metricAxesTitle: props.metricAxesTitle,
    metricCount: props.data.meta?.metric_names?.length || 0,
  })
})

const dimensionAxisTitle = computed(() => {
  return props.dimensionAxesTitle || getGranularityAxisTitle({
    i18n,
    granularity: timeSeriesGranularity.value,
  })
})

const tooltipMetricDisplay = computed(() => {
  return getTooltipMetricDisplay({
    i18n,
    metricName: props.data.meta?.metric_names?.[0],
    metricUnit: metricUnit.value,
    metricCount: props.data.meta?.metric_names?.length || 0,
  })
})

const defaultLegendSort = computed(() => createDefaultChartLegendSort(i18n.t('chartLabels.____OTHER____')))
const defaultTooltipSort = computed(() => createDefaultChartTooltipSort(i18n.t('chartLabels.____OTHER____')))
const chartLegendSortFn = computed(() => props.chartLegendSortFn || defaultLegendSort.value)
const chartTooltipSortFn = computed(() => props.chartTooltipSortFn || defaultTooltipSort.value)

const { selectedLabels, toggleLegendItem } = composables.useChartLabelSelection(chartData)

const { legendValues } = composables.useChartLegendValues(chartData, metricUnit)

const chartFlexClass = computed(() => {
  return props.legendPosition === 'bottom' ? 'column' : undefined
})

const legendItems = computed(() => {
  return chartData.value.datasets.map(dataset => ({
    label: dataset.label || '',
    color: dataset.backgroundColor || dataset.borderColor || '#000',
    borderColor: dataset.borderColor || dataset.backgroundColor || '#000',
    value: legendValues.value[dataset.label || ''],
    isSegmentEmpty: dataset.isSegmentEmpty,
    hidden: selectedLabels.value[dataset.label || ''] === false,
  })).sort(chartLegendSortFn.value)
})

const { option } = composables.useExploreResultToEchartTimeseries({
  chartData,
  chartType: toRef(props, 'type'),
  granularity: timeSeriesGranularity,
  stacked: toRef(props, 'stacked'),
  threshold: toRef(props, 'threshold'),
  metricUnit,
  tooltipTitle: toRef(props, 'tooltipTitle'),
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn,
  tooltipState,
})

const maxEntitiesShown = computed(() => props.data.meta?.limit?.toString() || null)
const resultSetTruncated = computed(() => {
  return props.hideTruncationWarning ? false : props.data.meta?.truncated || false
})
const hasValidChartData = computed(() => hasMillisecondTimestamps(chartData.value))

const zoomActionItems = computed<ZoomActionItem[]>(() => {
  return [
    ...(props.timeseriesZoom ? [{
      label: i18n.t('zoom_action_items.zoom'),
      key: 'zoom-in',
      action: (newTimeRange: AbsoluteTimeRangeV4) => emit('zoom-time-range', newTimeRange),
    }] : []),
    ...(props.exploreLink ? [{
      label: i18n.t('zoom_action_items.explore'),
      key: 'explore',
      href: props.exploreLink.href,
    }] : []),
    ...(props.requestsLink ? [{
      label: i18n.t('zoom_action_items.view_requests'),
      key: 'view-requests',
      href: props.requestsLink.href,
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
    tooltipState.value.interactionMode = 'selecting-chart-area'
  },
  onSelectionEnd: (timeRange) => {
    tooltipState.value.interactionMode = 'zoom-interactive'
    if (timeRange) {
      emit('select-chart-range', timeRange)
    }
  },
})

const { calculatePosition } = composables.useTooltipPosition({
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
})

const isInteractive = computed(() => {
  return ['interactive', 'zoom-interactive'].includes(tooltipState.value.interactionMode)
})

const resetTooltipState = () => {
  tooltipState.value.interactionMode = 'idle'
  tooltipState.value.visible = false
  if (props.timeseriesZoom) {
    clearBrush()
  }
}

const handleMouseMove = (event: any) => {
  if (props.timeseriesZoom) {
    brushMouseMove(event)
  }

  if (!isInteractive.value) {
    const pos = calculatePosition(event)

    if (pos) {
      tooltipState.value.left = pos.left
      tooltipState.value.top = pos.top
    }
  }
}

const handleMouseDown = (event: any) => {
  if (props.timeseriesZoom) {
    brushMouseDown(event)
  }
}

const handleMouseUp = (event: any) => {
  if (props.timeseriesZoom) {
    brushMouseUp(event)
  }
}

const handleClick = () => {
  if (props.timeseriesZoom && isSelecting.value) {
    return
  }

  if (tooltipState.value.interactionMode !== 'idle') {
    resetTooltipState()
  } else {
    tooltipState.value.interactionMode = 'interactive'
  }
}

const handleMouseOut = () => {
  if (!isInteractive.value) {
    tooltipState.value.visible = false
  }
}


</script>

<style scoped lang="scss">
@use "../styles/chart";
</style>

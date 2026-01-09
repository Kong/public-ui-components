<template>
  <BaseAnalyticsEcharts
    ref="baseChart"
    :option="option"
    :render-mode="renderMode"
    :theme="theme"
    @brush="handleBrush"
    @click="handleSeriesClick"
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
</template>

<script setup lang="ts">
import { computed, ref, toRef, useTemplateRef } from 'vue'
import { msToGranularity, type AbsoluteTimeRangeV4, type ExploreAggregations, type ExploreResultV4, type GranularityValues } from '@kong-ui-public/analytics-utilities'
import { useElementSize, useElementBounding } from '@vueuse/core'
import composables from '../composables'
import type { TooltipState } from './ChartTooltip.vue'
import ChartTooltip from './ChartTooltip.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'
import type { ZoomActionItem } from './ZoomActions.vue'
import type { Threshold, ExternalLink } from '../types'

const {
  data,
  type,
  stacked = false,
  timeseriesZoom = false,
  requestsLink = undefined,
  exploreLink = undefined,
  threshold = undefined,
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
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const tooltipState = ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const baseChartRef = useTemplateRef('baseChart')
const tooltipRef = useTemplateRef('tooltip')

const chartRef = computed(() => baseChartRef.value?.chart)
const containerRef = computed(() => baseChartRef.value?.container)
const chartEl = computed(() => chartRef.value?.$el as HTMLElement | undefined)

const { width: chartWidth, height: chartHeight } = useElementSize(chartEl)
const { top: containerTop, left: containerLeft } = useElementBounding(containerRef)

const tooltipWidth = computed(() => tooltipRef.value?.width)
const tooltipHeight = computed(() => tooltipRef.value?.height)

const isInteractive = computed(() => {
  return ['interactive', 'zoom-interactive'].includes(tooltipState.value.interactionMode)
})

// Chart option generation
const { i18n } = composables.useI18n()
const { option } = composables.useExploreResultToEchartTimeseries({
  exploreResult: toRef(() => data),
  chartType: toRef(() => type),
  stacked: toRef(() => stacked),
  threshold: toRef(() => threshold),
  tooltipState,
})

const timeSeriesGranularity = computed<GranularityValues>(() => {
  if (!data.meta.granularity_ms) {
    return msToGranularity(
      new Date(data.data[1].timestamp).getTime() - new Date(data.data[0].timestamp).getTime(),
    ) || 'hourly'
  }
  return msToGranularity(data.meta.granularity_ms) || 'hourly'
})

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

// Brush/zoom functionality (only when enabled)
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

// Tooltip positioning
const { calculatePosition } = composables.useTooltipPosition({
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
})

const resetTooltipState = () => {
  tooltipState.value.interactionMode = 'idle'
  tooltipState.value.visible = false
  if (timeseriesZoom) {
    clearBrush()
  }
}

const handleMouseMove = (e: any) => {
  if (timeseriesZoom) {
    brushMouseMove(e)
  }

  if (!isInteractive.value) {
    const pos = calculatePosition(e)
    if (pos) {
      tooltipState.value.left = pos.left
      tooltipState.value.top = pos.top
    }
  }
}

const handleMouseDown = (e: any) => {
  if (timeseriesZoom) {
    brushMouseDown(e)
  }
}

const handleMouseUp = (e: any) => {
  if (timeseriesZoom) {
    brushMouseUp(e)
  }
}

const handleSeriesClick = (params: any) => {
  if (params.componentType === 'series') {
    chartRef.value?.dispatchAction({
      type: 'toggleSelect',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    })
  }
}

const handleClick = () => {
  if (timeseriesZoom && isSelecting.value) {
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

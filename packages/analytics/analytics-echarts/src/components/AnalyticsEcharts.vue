<template>
  <div
    ref="container"
    class="kong-ui-public-analytics-echarts"
  >
    <VChart
      :key="`${theme}-${renderMode}`"
      ref="chart"
      :autoresize="true"
      class="chart"
      :option="option"
      @brush="handleBrush"
      @zr:click="handleClick"
      @zr:mousedown="handleMouseDown"
      @zr:mousemove="handleMouseMove"
      @zr:mouseout="handleMouseOut"
      @zr:mouseup="handleMouseUp"
    />
    <ChartTooltip
      ref="tooltip"
      :brush-time-range="brushTimeRange"
      :granularity="timeSeriesGranularity"
      :state="tooltipState"
      :zoom-action-items="zoomActionItems"
      @on-action="resetTooltipState"
    />
  </div>
</template>

<script setup lang="ts">

import { BarChart, LineChart } from 'echarts/charts'
import VChart, { THEME_KEY } from 'vue-echarts'
import type { ElementEvent } from 'echarts/core'
import { use } from 'echarts/core'
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BrushComponent,
  ToolboxComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from 'echarts/components'
import { computed, onUnmounted, provide, ref, toRef, useTemplateRef, watch } from 'vue'
import { msToGranularity, type AbsoluteTimeRangeV4, type ExploreAggregations, type ExploreResultV4, type GranularityValues, type ReportChartTypes } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import type { TooltipState } from './ChartTooltip.vue'
import ChartTooltip from './ChartTooltip.vue'
import { useElementSize, useElementBounding } from '@vueuse/core'
import type { ZoomActionItem } from './ZoomActions.vue'

interface ExternalLink {
  href: string
}

export type ThresholdType = 'warning' | 'error' | 'neutral'

export interface Threshold {
  type: ThresholdType
  value: number
  label?: string
  highlightIntersections?: boolean
}

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
  type: ReportChartTypes
  stacked?: boolean
  timeseriesZoom?: boolean
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
  threshold?: Partial<Record<ExploreAggregations, Threshold[]>>
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()
watch(() => renderMode, (newRenderMode) => {
  use([
    ...(newRenderMode === 'canvas' ? [CanvasRenderer] : []),
    ...(newRenderMode === 'svg' ? [SVGRenderer] : []),
    SVGRenderer,
    LineChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    BrushComponent,
    ToolboxComponent,
    MarkLineComponent,
    MarkAreaComponent,
  ])
}, { immediate: true })

provide(THEME_KEY, toRef(() => theme))

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const isDoingBrushSelection = ref(false)
const dragTimeout = ref<number | undefined>(undefined)
const dragStartX = ref<number | undefined>(undefined)
const brushTimeRange = ref<AbsoluteTimeRangeV4 | undefined>(undefined)
const tooltipState = ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const { i18n } = composables.useI18n()
const { option } = composables.useExploreResultToEchartTimeseries({
  exploreResult: toRef(() => data),
  chartType: toRef(() => type),
  stacked: toRef(() => stacked),
  threshold: toRef(() => threshold),
  tooltipState,
})
const containerRef = useTemplateRef('container')
const chartRef = useTemplateRef('chart')
const tooltipRef = useTemplateRef('tooltip')
const chartEl = computed(() => chartRef.value?.$el as HTMLElement | undefined)
const { width: chartWidth, height: chartHeight } = useElementSize(chartEl)
const { top: containerTop, left: containerLeft } = useElementBounding(containerRef)

const isInteractive = computed(() => {
  return ['interactive', 'zoom-interactive'].includes(tooltipState.value.interactionMode)
})
const tooltipWidth = computed(() => tooltipRef.value?.width)
const tooltipHeight = computed(() => tooltipRef.value?.height)
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

const makeTooltipInteractive = () => {
  tooltipState.value.interactionMode = 'interactive'
}

const resetTooltipState = () => {
  tooltipState.value.interactionMode = 'idle'
  tooltipState.value.visible = false
  isDoingBrushSelection.value = false
  chartRef.value?.dispatchAction({
    type: 'brush',
    command: 'clear',
    areas: [],
  })
}

const xValFromPixel = (e: ElementEvent) => {
  return chartRef.value?.convertFromPixel({ xAxisIndex: 0 }, e.offsetX)
}

const setBrush = (min: number, max: number) => {
  chartRef.value?.dispatchAction({
    type: 'brush',
    // one area, X-range in **data coords**, not pixels
    areas: [{
      brushType: 'lineX',
      xAxisIndex: 0,
      coordRange: [Math.min(min, max), Math.max(min, max)],
    }],
  })
}

const handleMouseMove = (e: ElementEvent) => {
  const x = e.offsetX
  const y = e.offsetY
  const offset = 40

  if (isDoingBrushSelection.value && dragStartX.value) {
    const xNow = xValFromPixel(e)
    if (xNow) {
      setBrush(dragStartX.value, xNow)
    }
  }

  if (tooltipWidth.value && tooltipHeight.value && !isInteractive.value) {
    // Horizontal positioning
    let left: number
    if (x > chartWidth.value / 2) {
    // Cursor is in right half, show tooltip to the left
      left = x - tooltipWidth.value - offset
    } else {
    // Cursor is in left half, show tooltip to the right
      left = x + offset
    }

    // Vertical positioning
    let top: number
    if (y > chartHeight.value / 2) {
    // Cursor is in bottom half, show tooltip above
      top = y - tooltipHeight.value - offset
    } else {
    // Cursor is in top half, show tooltip below
      top = y + offset
    }

    tooltipState.value.left = left + containerLeft.value
    tooltipState.value.top = top + containerTop.value
  }
}

const handleClick = () => {
  if (isDoingBrushSelection.value) {
    return
  }

  if (tooltipState.value.interactionMode !== 'idle') {
    resetTooltipState()
  } else {
    makeTooltipInteractive()
  }
}

const handleMouseOut = () => {
  if (!isInteractive.value) {
    tooltipState.value.visible = false
  }
}

const handleMouseDown = (e: ElementEvent) => {
  dragTimeout.value = window.setTimeout(() => {
    isDoingBrushSelection.value = true
    tooltipState.value.interactionMode = 'selecting-chart-area'
    chartRef.value?.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: {
        brushType: 'lineX',
        brushMode: 'single',
        xAxisIndex: 0,
      },
    })
    chartRef.value?.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'brush',
      brushOption: { brushType: false },
    })
    dragStartX.value = xValFromPixel(e)
    if (dragStartX.value) {
      setBrush(dragStartX.value, dragStartX.value)
    }
  }, 150)
}

const handleMouseUp = (e: ElementEvent) => {
  clearTimeout(dragTimeout.value)
  if (!isDoingBrushSelection.value) return
  isDoingBrushSelection.value = false
  const xEnd = xValFromPixel(e)
  if (xEnd && dragStartX.value) {
    setBrush(dragStartX.value, xEnd)
  }
  chartRef.value?.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'brush',
    brushOption: { brushType: false },
  })
  tooltipState.value.interactionMode = 'zoom-interactive'
  if (brushTimeRange.value) {
    emit('select-chart-range', brushTimeRange.value)
  }
}

const handleBrush = (e: any) => {
  brushTimeRange.value = {
    type: 'absolute',
    start: new Date(e.areas[0]?.coordRange[0]),
    end: new Date(e.areas[0]?.coordRange[1]),
  }
}

onUnmounted(() => {
  if (dragTimeout.value) {
    clearTimeout(dragTimeout.value)
  }
})

</script>

<style lang="scss" scoped>
.kong-ui-public-analytics-echarts {
  height: 100%;
  width: 100%;
}
</style>

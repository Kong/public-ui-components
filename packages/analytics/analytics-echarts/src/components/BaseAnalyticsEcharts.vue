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
      manual-update
      :option="option"
      @brush="handleBrush"
      @click="handleSeriesClick"
      @zr:click="handleClick"
      @zr:mousedown="handleMouseDown"
      @zr:mousemove="handleMouseMove"
      @zr:mouseout="handleMouseOut"
      @zr:mouseup="handleMouseUp"
    />
    <ChartTooltip
      ref="tooltip"
      :brush-time-range="brushTimeRange"
      :granularity="granularity"
      :state="tooltipState"
      :zoom-action-items="zoomActionItems"
      @on-action="resetTooltipState"
    />
  </div>
</template>

<script setup lang="ts">
import { BarChart, LineChart, PieChart } from 'echarts/charts'
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
import type { AbsoluteTimeRangeV4, GranularityValues } from '@kong-ui-public/analytics-utilities'
import type { TooltipState } from './ChartTooltip.vue'
import ChartTooltip from './ChartTooltip.vue'
import { useElementSize, useElementBounding } from '@vueuse/core'
import type { ZoomActionItem } from './ZoomActions.vue'
import type { ECBasicOption } from 'echarts/types/dist/shared'

const {
  option,
  enableBrush = false,
  zoom = false,
  granularity = undefined,
  zoomActionItems = undefined,
  theme = 'light',
  renderMode = 'svg',
} = defineProps<{
  option: ECBasicOption
  enableBrush?: boolean
  zoom?: boolean
  granularity?: GranularityValues
  zoomActionItems?: ZoomActionItem[]
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const tooltipState = defineModel<TooltipState>('tooltipState', { required: true })

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

watch(() => renderMode, (newRenderMode) => {
  use([
    ...(newRenderMode === 'canvas' ? [CanvasRenderer] : []),
    ...(newRenderMode === 'svg' ? [SVGRenderer] : []),
    LineChart,
    BarChart,
    PieChart,
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

const isDoingBrushSelection = ref(false)
const dragTimeout = ref<number | undefined>(undefined)
const dragStartX = ref<number | undefined>(undefined)
const brushTimeRange = ref<AbsoluteTimeRangeV4 | undefined>(undefined)

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

watch(() => option, (newOption) => {
  resetTooltipState()
  chartRef.value?.setOption(newOption, { notMerge: true, lazyUpdate: false })
}, { deep: true })

const makeTooltipInteractive = () => {
  tooltipState.value.interactionMode = 'interactive'
}

const resetTooltipState = () => {
  tooltipState.value.interactionMode = 'idle'
  tooltipState.value.visible = false
  if (enableBrush) {
    isDoingBrushSelection.value = false
    chartRef.value?.dispatchAction({
      type: 'brush',
      command: 'clear',
      areas: [],
    })
  }
}

const xValFromPixel = (e: ElementEvent) => {
  return chartRef.value?.convertFromPixel({ xAxisIndex: 0 }, e.offsetX)
}

const setBrush = (min: number, max: number) => {
  chartRef.value?.dispatchAction({
    type: 'brush',
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

  if (enableBrush && isDoingBrushSelection.value && dragStartX.value) {
    const xNow = xValFromPixel(e)
    if (xNow) {
      setBrush(dragStartX.value, xNow)
    }
  }

  if (tooltipWidth.value && tooltipHeight.value && !isInteractive.value) {
    // Horizontal positioning
    let left: number
    if (x > chartWidth.value / 2) {
      left = x - tooltipWidth.value - offset
    } else {
      left = x + offset
    }

    // Vertical positioning
    let top: number
    if (y > chartHeight.value / 2) {
      top = y - tooltipHeight.value - offset
    } else {
      top = y + offset
    }

    tooltipState.value.left = left + containerLeft.value
    tooltipState.value.top = top + containerTop.value
  }
}

const handleSeriesClick = (params: any) => {
  if (params.componentType === 'series') {
    // Toggle selection using ECharts API
    chartRef.value?.dispatchAction({
      type: 'toggleSelect',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    })
  }
}

const handleClick = () => {
  if (enableBrush && isDoingBrushSelection.value) {
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
  if (!enableBrush) return

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
  if (!enableBrush || !isDoingBrushSelection.value) return

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
  if (!enableBrush) return

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

  .chart {
    height: 100%;
    width: 100%;
  }
}
</style>

<template>
  <div
    ref="chartParent"
    class="chart-parent"
    :class="chartFlexClass(legendPosition)"
    data-testid="line-chart-parent"
  >
    <div
      class="chart-container"
      @click="handleChartClick()"
    >
      <Line
        v-if="type === 'timeseries_line'"
        :key="remountLineKey"
        ref="chartInstance"
        :chart-id="chartID"
        class="chart-canvas"
        :data="(chartData as any)"
        data-testid="time-series-line-chart"
        :options="(options as any)"
        :plugins="plugins"
      />
      <Bar
        v-else-if="type === 'timeseries_bar'"
        :key="remountBarKey"
        ref="chartInstance"
        :chart-id="chartID"
        class="chart-canvas"
        :data="(chartData as any)"
        data-testid="time-series-bar-chart"
        :options="(options as any)"
        :plugins="plugins"
      />
    </div>
    <ToolTip
      v-if="!hideTooltipWhenDragging"
      ref="tooltipElement"
      :absolute-left="tooltipAbsoluteLeft"
      :absolute-top="tooltipAbsoluteTop"
      data-testid="tooltip"
      :state="tooltipData"
      :tooltip-title="tooltipTitle"
      :zoom-action-items="zoomActionItems"
      :zoom-time-range="zoomTimeRange"
      @dimensions="tooltipDimensions"
      @on-action="() => resetTooltipState(false)"
    />
    <ChartLegend
      :id="legendID"
      :chart-instance="chartInstance"
      data-testid="legend"
      :items="legendItems"
    />
  </div>
</template>

<script setup lang="ts">

import { reactive, ref, computed, toRef, inject, watch, onUnmounted, useTemplateRef, onMounted } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
import { VerticalLinePlugin } from '../chart-plugins/VerticalLinePlugin'
import { HighlightPlugin } from '../chart-plugins/HighlightPlugin'
import { DragSelectPlugin } from '../chart-plugins/DragSelectPlugin'
import type { DragSelectEventDetail } from '../chart-plugins/DragSelectPlugin'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import ChartLegend from '../chart-plugins/ChartLegend.vue'
import { Line, Bar } from 'vue-chartjs'
import composables from '../../composables'
import type { TooltipState, ZoomActionItem } from '../../types'
import { type ChartLegendSortFn, type ChartTooltipSortFn, type EnhancedLegendItem, type KChartData, type LegendValues, type TooltipEntry } from '../../types'
import type { GranularityValues, AbsoluteTimeRangeV4, AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import type { Chart } from 'chart.js'
import { ChartLegendPosition } from '../../enums'
import { generateLegendItems } from '../../utils'
import { hasExactlyOneDatapoint } from '../../utils/commonOptions'
import { INJECT_QUERY_PROVIDER } from '../../constants'

interface TimeSeriesChartProps {
  chartData?: KChartData
  type?: 'timeseries_bar' | 'timeseries_line'
  fill?: boolean
  tooltipTitle: string
  metricUnit?: string
  timeRangeMs?: number
  granularity: GranularityValues
  stacked?: boolean
  legendValues?: LegendValues
  metricAxesTitle?: string
  dimensionAxesTitle?: string
  syntheticsDataKey?: string
  chartLegendSortFn?: ChartLegendSortFn
  chartTooltipSortFn?: ChartTooltipSortFn
  brush?: boolean
  zoomActionItems?: ZoomActionItem[]
  tooltipMetricDisplay?: string
}

const props = withDefaults(
  defineProps<TimeSeriesChartProps>(),
  {
    chartData: undefined,
    type: 'timeseries_line',
    fill: false,
    metricUnit: '',
    timeRangeMs: undefined,
    stacked: true,
    legendValues: undefined,
    metricAxesTitle: undefined,
    dimensionAxesTitle: undefined,
    syntheticsDataKey: '',
    chartLegendSortFn: (a: EnhancedLegendItem, b: EnhancedLegendItem) => a.value && b.value && b.value.raw - a.value.raw,
    chartTooltipSortFn: (a: TooltipEntry, b: TooltipEntry) => b.rawValue - a.rawValue,
    brush: false,
    zoomActionItems: undefined,
    tooltipMetricDisplay: '',
  },
)

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const verticalLinePlugin = new VerticalLinePlugin()
const highlightPlugin = new HighlightPlugin()
const dragSelectPlugin = new DragSelectPlugin()
const { translateUnit } = composables.useTranslatedUnits()
const chartInstance = ref<{ chart: Chart }>()
const legendID = crypto.randomUUID()
const chartID = crypto.randomUUID()
const legendItems = ref<EnhancedLegendItem[]>([])
const tooltipElement = ref()
const legendPosition = inject('legendPosition', ChartLegendPosition.Right)
const chartParentRef = useTemplateRef<HTMLDivElement>('chartParent')
const zoomTimeRange = ref<AbsoluteTimeRangeV4 | undefined>(undefined)
const isDoingSelection = ref(false)
const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const hasZoomActions = queryBridge?.evaluateFeatureFlagFn('analytics-chart-zoom-actions', false)

const tooltipData = reactive<TooltipState>({
  showTooltip: false,
  tooltipContext: 0, // Set in lineChartTooltipBehavior
  metricDisplay: props.tooltipMetricDisplay,
  tooltipSeries: [],
  left: '',
  top: '',
  units: props.metricUnit,
  translateUnit,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartType: props.type,
  chartID,
  chartTooltipSortFn: props.chartTooltipSortFn,
  interactionMode: 'idle',
})

const { tooltipAbsoluteLeft, tooltipAbsoluteTop } = composables.useTooltipAbsolutePosition(
  chartParentRef,
  tooltipData,
)

const htmlLegendPlugin = {
  id: legendID,
  afterUpdate(chart: Chart) {
    legendItems.value = generateLegendItems(chart, props.legendValues, props.chartLegendSortFn)
  },
}

const plugins = computed(() => [
  htmlLegendPlugin,
  highlightPlugin,
  ...(props.brush ? [dragSelectPlugin] : []),
  ...(props.type === 'timeseries_line' ? [verticalLinePlugin] : []),
])

const remountLineKey = computed(() => `line-${plugins.value.map(p => p.id).join('-')}`)
const remountBarKey = computed(() => `bar-${plugins.value.map(p => p.id).join('-')}`)

const pointsWithoutHover = computed(() => props.chartData && hasExactlyOneDatapoint(props.chartData))

const hideTooltipWhenDragging = computed(() => {
  if (!hasZoomActions) {
    return isDoingSelection.value
  } else {
    return false
  }
})

const { options } = composables.useLineChartOptions({
  tooltipState: tooltipData,
  timeRangeMs: toRef(props, 'timeRangeMs'),
  granularity: toRef(props, 'granularity'),
  legendID,
  stacked: toRef(props, 'stacked'),
  metricAxesTitle: toRef(props, 'metricAxesTitle'),
  dimensionAxesTitle: toRef(props, 'dimensionAxesTitle'),
  pointsWithoutHover: pointsWithoutHover,
})

composables.useReportChartDataForSynthetics(toRef(props, 'chartData'), toRef(props, 'syntheticsDataKey'))

/**
     * When in Preview mode, Chart and Legend are vertically stacked, and the
     * Legend list items are allowed to spread horizontally.
     */
const chartFlexClass = (position: `${ChartLegendPosition}`) => {
  return {
    [ChartLegendPosition.Right]: 'legend-row',
    [ChartLegendPosition.Bottom]: 'column',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[position]
}

const tooltipDimensions = ({ width, height }: { width: number, height: number }) => {
  tooltipData.width = width
  tooltipData.height = height
}

const resetTooltipState = (supressNextClickForHighlight: boolean = true) => {
  tooltipData.interactionMode = 'idle'
  tooltipData.showTooltip = false
  dragSelectPlugin.clearSelectionArea()
  if (highlightPlugin.isPaused) {
    highlightPlugin.resume(supressNextClickForHighlight)
  }
  if (verticalLinePlugin.isPaused) {
    verticalLinePlugin.resume()
  }
}

const activateInteractiveTooltip = () => {
  tooltipData.interactionMode = 'interactive'
}

const updateVerticalLinePlugin = () => {
  if (!chartInstance.value || !chartInstance.value.chart.tooltip?.dataPoints?.length) {
    return
  }

  if (tooltipData.interactionMode === 'interactive') {
    verticalLinePlugin.clickedSegment = chartInstance.value.chart.tooltip.dataPoints[0]
  } else {
    verticalLinePlugin.destroyClickedSegment()
  }
}

const handleChartClick = () => {
  if (isDoingSelection.value) {
    isDoingSelection.value = false
    return
  }

  if (tooltipData.interactionMode !== 'idle') {
    resetTooltipState()
  } else {
    activateInteractiveTooltip()
  }

  updateVerticalLinePlugin()
}
watch(() => props.type, () => {
  tooltipData.interactionMode = 'idle'
  tooltipData.showTooltip = false
  verticalLinePlugin.destroyClickedSegment()
})

const handleDragSelect = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  const { xStart, xEnd } = (event as CustomEvent<DragSelectEventDetail>).detail
  if (xStart && xEnd) {
    zoomTimeRange.value = {
      start: new Date(xStart),
      end: new Date(xEnd),
      type: 'absolute',
    }

    if (hasZoomActions) {
      tooltipData.interactionMode = 'zoom-interactive'
    } else {
      emit('zoom-time-range', { start: new Date(xStart), end: new Date(xEnd), type: 'absolute' })
      resetTooltipState()
    }

    emit('select-chart-range', zoomTimeRange.value)
  }
}

const handleDragMove = (event: Event) => {
  if (hasZoomActions) {
    tooltipData.interactionMode = 'selecting-chart-area'
  }
  isDoingSelection.value = true
  verticalLinePlugin.pause()
  highlightPlugin.pause()

  const { xStart, xEnd } = (event as CustomEvent<DragSelectEventDetail>).detail

  if (xStart && xEnd) {
    zoomTimeRange.value = {
      start: new Date(xStart),
      end: new Date(xEnd),
      type: 'absolute',
    }
  }
}

// Reset tooltip if clicking outside of chart when in interactive mode
const handleGlobalClick = (event: MouseEvent) => {
  // If we are not in an interactive mode, nothing to reset
  if (!chartParentRef.value || tooltipData.interactionMode === 'idle') {
    return
  }

  const target = event.target

  // Ignore if the click was inside the chart parent (includes tooltip & legend since they are rendered inside)
  if (target && chartParentRef.value.contains(target as Node)) {
    return
  }

  // Ignore while a drag selection is in progress
  if (isDoingSelection.value) {
    return
  }

  resetTooltipState(false)
}

watch(() => chartInstance.value?.chart, () => {
  if (chartInstance.value?.chart) {
    chartInstance.value.chart.canvas.removeEventListener('dragSelect', handleDragSelect)
    chartInstance.value.chart.canvas.removeEventListener('dragSelectMove', handleDragMove)
    chartInstance.value.chart.canvas.addEventListener('dragSelect', handleDragSelect)
    chartInstance.value.chart.canvas.addEventListener('dragSelectMove', handleDragMove)
  }
})

onMounted(() => {
  document.addEventListener('click', handleGlobalClick, true)
})

onUnmounted(() => {
  if (chartInstance.value?.chart) {
    chartInstance.value.chart.canvas.removeEventListener('dragSelect', handleDragSelect)
    chartInstance.value.chart.canvas.removeEventListener('dragSelectMove', handleDragMove)
  }
  document.removeEventListener('click', handleGlobalClick, true)
})

</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";
</style>

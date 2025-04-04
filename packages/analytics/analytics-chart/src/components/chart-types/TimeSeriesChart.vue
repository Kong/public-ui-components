<template>
  <div
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
      v-if="!isDoingSelection"
      ref="tooltipElement"
      :context="formatTimestamp(tooltipData.tooltipContext)"
      data-testid="tooltip"
      :left="tooltipData.left"
      :locked="tooltipData.locked"
      :series="tooltipData.tooltipSeries"
      :show-tooltip="tooltipData.showTooltip"
      :tooltip-title="tooltipTitle"
      :top="tooltipData.top"
      :unit="metricUnit"
      @dimensions="tooltipDimensions"
      @left="(left: string) => tooltipData.left = left"
      @top="(top: string) => tooltipData.top = top"
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

import type { PropType } from 'vue'
import { reactive, ref, computed, toRef, inject, watch, onUnmounted } from 'vue'
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
import type { ChartLegendSortFn, ChartTooltipSortFn, EnhancedLegendItem, KChartData, LegendValues, TooltipEntry } from '../../types'
import type { GranularityValues, AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { Chart } from 'chart.js'
import { ChartLegendPosition } from '../../enums'
import { formatByGranularity, generateLegendItems } from '../../utils'
import { hasExactlyOneDatapoint } from '../../utils/commonOptions'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
  },
  type: {
    type: String as PropType<'timeseries_bar' | 'timeseries_line'>,
    required: false,
    default: 'timeseries_line',
  },
  fill: {
    type: Boolean,
    required: false,
    default: false,
  },
  tooltipTitle: {
    type: String,
    required: true,
  },
  metricUnit: {
    type: String,
    required: false,
    default: '',
  },
  timeRangeMs: {
    type: Number,
    required: false,
    default: undefined,
  },
  granularity: {
    type: String as PropType<GranularityValues>,
    required: true,
  },
  stacked: {
    type: Boolean,
    required: false,
    default: true,
  },
  legendValues: {
    type: Object as PropType<LegendValues>,
    required: false,
    default: null,
  },
  metricAxesTitle: {
    type: String,
    required: false,
    default: null,
  },
  dimensionAxesTitle: {
    type: String,
    required: false,
    default: null,
  },
  syntheticsDataKey: {
    type: String,
    required: false,
    default: '',
  },
  chartLegendSortFn: {
    type: Function as PropType<ChartLegendSortFn>,
    required: false,
    default: (a: EnhancedLegendItem, b: EnhancedLegendItem) => a.value && b.value && b.value.raw - a.value.raw,
  },
  chartTooltipSortFn: {
    type: Function as PropType<ChartTooltipSortFn>,
    required: false,
    default: (a: TooltipEntry, b: TooltipEntry) => b.rawValue - a.rawValue,
  },
  zoom: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void,
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
const legendPosition = ref(inject('legendPosition', ChartLegendPosition.Right))
const isDoingSelection = ref(false)

const tooltipData = reactive({
  showTooltip: false,
  tooltipContext: 0,
  tooltipSeries: [],
  left: '',
  top: '',
  units: toRef(props, 'metricUnit'),
  translateUnit,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartType: props.type,
  locked: false,
  chartID,
  chartTooltipSortFn: props.chartTooltipSortFn,
})

const htmlLegendPlugin = {
  id: legendID,
  afterUpdate(chart: Chart) {
    legendItems.value = generateLegendItems(chart, props.legendValues, props.chartLegendSortFn)
  },
}

const plugins = computed(() => [
  htmlLegendPlugin,
  highlightPlugin,
  ...(props.zoom ? [dragSelectPlugin] : []),
  ...(props.type === 'timeseries_line' ? [verticalLinePlugin] : []),
])

const remountLineKey = computed(() => `line-${plugins.value.map(p => p.id).join('-')}`)
const remountBarKey = computed(() => `bar-${plugins.value.map(p => p.id).join('-')}`)

const pointsWithoutHover = computed(() => hasExactlyOneDatapoint(props.chartData))

const { options } = composables.useLinechartOptions({
  tooltipState: tooltipData,
  timeRangeMs: toRef(props, 'timeRangeMs'),
  granularity: toRef(props, 'granularity'),
  legendID: legendID,
  stacked: toRef(props, 'stacked'),
  metricAxesTitle: toRef(props, 'metricAxesTitle'),
  dimensionAxesTitle: toRef(props, 'dimensionAxesTitle'),
  pointsWithoutHover: pointsWithoutHover,
})

composables.useReportChartDataForSynthetics(toRef(props, 'chartData'), toRef(props, 'syntheticsDataKey'))

const formatTimestamp = (ts: number): string | number => {
  return formatByGranularity(new Date(ts), props.granularity, true)
}

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

// @ts-ignore: allow untyped param
const tooltipDimensions = ({ width, height }) => {
  tooltipData.width = width
  tooltipData.height = height
}

const handleChartClick = () => {
  tooltipData.locked = !tooltipData.locked

  if (chartInstance.value && chartInstance.value.chart.tooltip?.dataPoints?.length) {
    verticalLinePlugin.clickedSegment = tooltipData.locked
      ? chartInstance.value.chart.tooltip?.dataPoints[0]
      : undefined
  }
}

watch(() => props.type, () => {
  tooltipData.locked = false
  tooltipData.showTooltip = false
  delete verticalLinePlugin.clickedSegment
})

const handleDragSelect = (event: Event) => {
  const { xStart, xEnd } = (event as CustomEvent<DragSelectEventDetail>).detail
  if (xStart && xEnd) {
    emit('zoom-time-range', { start: new Date(xStart), end: new Date(xEnd), type: 'absolute' })
  }
  isDoingSelection.value = false
  handleChartClick()
  verticalLinePlugin.pause = false
}

const handleDragMove = () => {
  isDoingSelection.value = true
  verticalLinePlugin.pause = true
}

watch(() => chartInstance.value?.chart, () => {
  if (chartInstance.value?.chart) {
    chartInstance.value.chart.canvas.removeEventListener('dragSelect', handleDragSelect)
    chartInstance.value.chart.canvas.removeEventListener('dragSelectMove', handleDragMove)
    chartInstance.value.chart.canvas.addEventListener('dragSelect', handleDragSelect)
    chartInstance.value.chart.canvas.addEventListener('dragSelectMove', handleDragMove)
  }
})

onUnmounted(() => {
  if (chartInstance.value?.chart) {
    chartInstance.value.chart.canvas.removeEventListener('dragSelect', handleDragSelect)
    chartInstance.value.chart.canvas.removeEventListener('dragSelectMove', handleDragMove)
  }
})

</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";
</style>

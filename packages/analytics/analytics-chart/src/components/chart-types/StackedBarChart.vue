<template>
  <div
    class="chart-parent"
    :class="chartFlexClass[legendPosition]"
  >
    <canvas
      ref="axis"
      class="axis"
    />
    <div
      class="chart-container"
      :style="{
        'overflow-x': numLabels > MAX_BARS_VERTICAL ? 'auto' : 'hidden',
      }"
      @:scroll="onScrolling"
      @click="handleChartClick()"
    >
      <div
        class="chart-body"
        :style="{ width: chartWidth }"
      >
        <canvas
          ref="canvas"
        />
      </div>
    </div>
    <div
      v-if="axesTooltip.show"
      class="axis-tooltip"
      :style="{ top: axesTooltip.top, left: axesTooltip.left}"
    >
      {{ axesTooltip.text }}
    </div>
    <ToolTip
      :context="tooltipData.tooltipContext"
      :left="tooltipData.left"
      :locked="tooltipData.locked"
      :series="tooltipData.tooltipSeries"
      :show-tooltip="tooltipData.showTooltip"
      :tooltip-title="tooltipTitle"
      :top="tooltipData.top"
      @dimensions="tooltipDimensions"
    />
    <ChartLegend
      :id="legendID"
      :chart-instance="chartInstance"
      :items="legendItems"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChartDataset, ChartOptions } from 'chart.js'
import { Chart } from 'chart.js'
import type { EventContext } from 'chartjs-plugin-annotation'
import annotationPlugin from 'chartjs-plugin-annotation'
import { ref, toRef, onMounted, computed, reactive, watch, inject, onBeforeUnmount } from 'vue'
import type { PropType, Ref } from 'vue'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import ChartLegend from '../chart-plugins/ChartLegend.vue'
import type { BarChartData } from '../../utils'
import { accessibleGrey, MAX_LABEL_LENGTH, formatNumber, getTextHeight, getTextWidth, drawPercentage, dataTotal, conditionalDataTotal } from '../../utils'
import composables from '../../composables'
import { v4 as uuidv4 } from 'uuid'
import { ChartLegendPosition, ChartTypes } from '../../enums'
import type { AxesTooltipState, ChartDatasetSortFn, EnhancedLegendItem, KChartData, LegendValues, TooltipState } from '../../types'
import { highlightPlugin } from '../chart-plugins/HighlightPlugin'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: () => ({ labels: [], datasets: [] }),
  },
  tooltipTitle: {
    type: String,
    required: false,
    default: '',
  },
  legendValues: {
    type: Object as PropType<LegendValues>,
    required: false,
    default: null,
  },
  metricUnit: {
    type: String,
    required: false,
    default: '',
  },
  orientation: {
    type: String,
    required: false,
    default: 'horizontal',
    validator: (val: string) => ['horizontal', 'vertical'].includes(val),
  },
  annotations: {
    type: Boolean,
    required: false,
    default: true,
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
  stacked: {
    type: Boolean,
    required: false,
    default: true,
  },
  syntheticsDataKey: {
    type: String,
    required: false,
    default: '',
  },
  // This component needs to keep track of the height.
  height: {
    type: String,
    required: false,
    default: '500px',
    validator: (value: string): boolean => {
      return /(\d *)(px|%)/.test(value)
    },
  },
  chartDatasetSortFn: {
    type: Function as PropType<ChartDatasetSortFn>,
    required: false,
    default: (a: EnhancedLegendItem, b: EnhancedLegendItem) => a.value && b.value && b.value.raw - a.value.raw,
  },
})

const emit = defineEmits(['heightUpdate'])

const { i18n } = composables.useI18n()

// https://www.chartjs.org/chartjs-plugin-annotation/latest/guide/types/label.html#label-annotation-specific-options
const LABEL_PADDING = 6

// Parameters for bar sizing.
const MIN_BAR_HEIGHT = 20
const MIN_CHART_WIDTH = '100%'
const MAX_BARS_VERTICAL = 30
const MIN_BAR_WIDTH = 40
const SCROLL_MIN = 0
const SCROLL_MAX = 10
const AXIS_BOTTOM_OFFSET = 10
const AXIS_RIGHT_PADDING = 1

const totalValueOfDataset = ({ chart }: EventContext, label: string) => {
  const chartData: BarChartData = chart.data as BarChartData
  const labelIndex = chartData.labels?.indexOf(label) as number

  return chartData.datasets.reduce((acc: number, current: ChartDataset, idx: number) => {
    if (chart.isDatasetVisible(idx)) {
      const val = current.data[labelIndex] as number

      return isNaN(val) ? acc : acc + val
    } else {
      return acc
    }
  }, 0)
}

const makeAnnotations = (data: BarChartData, label: string, unit: string, orientation: string) => {
  const isHorizontal = orientation === 'horizontal'

  if (label === null) {
    label = i18n.t('entityNoName')
  }

  const commonProps = {
    type: 'label',
    yValue: (ctx: EventContext) => isHorizontal ? label : totalValueOfDataset(ctx, label),
    xValue: (ctx: EventContext) => isHorizontal ? totalValueOfDataset(ctx, label) : label,
  }

  const valueAnnotation = {
    ...commonProps,
    position: isHorizontal
      ? { x: 'start', y: 'center' }
      : { x: 'center', y: 'end' },
    yAdjust: () => isHorizontal ? 0 : (-Math.abs(getTextHeight())),
    content: (ctx: EventContext) => formatNumber(totalValueOfDataset(ctx, label), unit),
  }

  const percentAnnotation = {
    ...commonProps,
    content: (ctx: EventContext) => drawPercentage(totalValueOfDataset(ctx, label), conditionalDataTotal(ctx.chart, data)),
    position: isHorizontal
      ? { x: 'start', y: 'center' }
      : { x: 'center', y: 'end' },
    xAdjust: (ctx: EventContext) => isHorizontal ? getTextWidth(formatNumber(totalValueOfDataset(ctx, label), unit)) : 0,
    color: accessibleGrey,
  }

  return {
    [`${label}-value`]: valueAnnotation,
    [`${label}-percent`]: percentAnnotation,
  }
}

const canvas = ref<HTMLCanvasElement>()
const axis = ref< HTMLCanvasElement>()
const legendID = ref(uuidv4())
const reactiveAnnotationsID = uuidv4()
const maxOverflowPluginID = uuidv4()
const legendItems = ref([])
const legendPosition = ref(inject('legendPosition', ChartLegendPosition.Right))
const axesTooltip = ref<AxesTooltipState>({
  show: false,
  top: '0px',
  left: '0px',
  text: '',
  offset: 0,
})
const unitsRef = toRef(props, 'metricUnit')
const translatedUnits = computed(() => {
  // @ts-ignore - dynamic i18n key
  return unitsRef.value && i18n.t(`chartUnits.${unitsRef.value}`)
})

const isHorizontal = computed(() => toRef(props, 'orientation').value === 'horizontal')

const tooltipData: TooltipState = reactive({
  showTooltip: false,
  tooltipContext: '',
  tooltipSeries: [],
  left: '',
  top: '',
  units: translatedUnits,
  offset: 0,
  width: 0,
  height: 0,
  locked: false,
  chartType: isHorizontal.value ? ChartTypes.HORIZONTAL_BAR : ChartTypes.VERTICAL_BAR,
})
const dependsOnChartUpdate = ref(0)

const configureAnnotations = () => props.annotations && props.chartData.labels?.reduce((acc, label) =>
  Object.assign(acc, makeAnnotations(props.chartData as BarChartData, label, unitsRef.value, props.orientation)),
{},
)

const htmlLegendPlugin = {
  id: legendID.value,
  afterUpdate(chart: Chart) {
    // Update any computed properties that depend on chart state.
    // As of writing, this is important for correctly calculating maxOverflow based on dataset visibility.
    dependsOnChartUpdate.value += 1
    // @ts-ignore - ChartJS types are incomplete
    legendItems.value = chart.options.plugins.legend.labels.generateLabels(chart)
      .map(e => ({ ...e, value: props.legendValues && props.legendValues[e.text] }))
      .sort(props.chartDatasetSortFn)
  },
}

const reactiveAnnotationsPlugin = {
  id: reactiveAnnotationsID,
  afterUpdate(chart: Chart) {
    // @ts-ignore - ChartJS types are incomplete
    chart.options.plugins.annotation.annotations = props.annotations ? configureAnnotations() : {}
  },
}

const maxOverflowPlugin = {
  id: maxOverflowPluginID,
  afterUpdate(chart: Chart) {
    // @ts-ignore - ChartJS types are incomplete
    chart.options.layout.padding.right = isHorizontal.value ? maxOverflow.value : 0
  },
}

const axesTooltipPlugin = {
  id: 'axisHover',
  // args any because it is not typed by chartjs
  // https://www.chartjs.org/docs/latest/api/interfaces/Plugin.html#parameters
  afterEvent(chart: Chart, args: any) {
    axesTooltip.value.show = false
    if (args.event.type === 'mousemove') {
      const evt = args.event
      const indexAxis = chart.options.indexAxis as ('x' | 'y')
      const scales = chart.scales
      const text = chart.scales[indexAxis].getLabelForValue(Number(chart.scales[indexAxis].getValueForPixel(evt[indexAxis])))

      const compareByIndexAxis = (axis: string) => {
        return axis === 'x'
          ? evt.y > scales.x.top
          : evt.x < scales.y.right
      }

      if (compareByIndexAxis(indexAxis)) {
        // Prevent hiding the tooltip if it's locked
        if (!tooltipData.locked) {
          tooltipData.showTooltip = false
        }
        if (text.length > MAX_LABEL_LENGTH) {
          const context = chart.canvas.getContext('2d') as CanvasRenderingContext2D
          const textWidthPixels = context.measureText(text).width

          const leftOfCursor = Math.abs(Math.round(evt.x - textWidthPixels * 0.5))
          const rightOfCursor = Math.round(evt.x + textWidthPixels * 0.5)

          axesTooltip.value.left = indexAxis === 'x'
            ? `${(leftOfCursor > 0 ? leftOfCursor : rightOfCursor) - axesTooltip.value.offset}px`
            : `${(evt.x - textWidthPixels * 0.5) - axesTooltip.value.offset}px`
          axesTooltip.value.top = `${evt.y - 50}px`

          axesTooltip.value.show = true
          axesTooltip.value.text = text
        } else {
          axesTooltip.value.show = false
        }
      } else {
        axesTooltip.value.show = false
      }
    }
  },
}

const plugins = [
  htmlLegendPlugin,
  axesTooltipPlugin,
  maxOverflowPlugin,
  highlightPlugin,
  ...(props.annotations ? [reactiveAnnotationsPlugin] : []),
]

const numLabels = computed(() => {
  return (props.chartData.labels && props.chartData.labels.length) || 0
})

const chartWidth = computed(() => {
  let value: number | string = MIN_CHART_WIDTH

  if (canvas.value) {
    value = canvas.value.width

    if (canvas.value && props.chartData?.labels && props.chartData?.labels.length > MAX_BARS_VERTICAL && !isHorizontal.value) {
      const numLabels = props.chartData.labels.length

      const baseWidth = canvas.value.offsetWidth
      const preferredChartWidth = baseWidth + ((numLabels - MAX_BARS_VERTICAL) * MIN_BAR_WIDTH)

      value = `${preferredChartWidth}px`
    }
  }

  return value
})

watch(() => props.chartData.labels?.length, (numLabels) => {
  let chartHeight = parseInt(props.height, 10)
  if (numLabels && isHorizontal.value) {

    // The goal is to keep the bar width greater than or roughly equal to the text width.
    const preferredChartHeight = numLabels * MIN_BAR_HEIGHT
    chartHeight = Math.max(preferredChartHeight, chartHeight)
  }

  emit('heightUpdate', chartHeight)
})

composables.useReportChartDataForSynthetics(toRef(props, 'chartData'), toRef(props, 'syntheticsDataKey'))

onMounted(() => {
  // Note: if we ever want to use 2 separate stacked bar charts on the same page,
  // this approach may result in weird behavior.  If that happens, consider just registering
  // the components globally.  If we do register them globally, we'll need to be careful to make
  // sure the annotation plugin doesn't break vue-chartjs (or we'll need to make sure we're no longer
  // using vue-chartjs).
  if (props.annotations) {
    Chart.register(annotationPlugin)
  }
})

const options = computed<ChartOptions>(() => {
  const defaultOptions = composables.useBarChartOptions({
    tooltipState: tooltipData,
    legendID: legendID.value,
    stacked: toRef(props, 'stacked'),
    metricAxesTitle: toRef(props, 'metricAxesTitle'),
    dimensionAxesTitle: toRef(props, 'dimensionAxesTitle'),
    indexAxis: isHorizontal.value ? 'y' : 'x',
  })
  return {
    ...defaultOptions.value,
    plugins: {
      ...defaultOptions.value.plugins,
      annotation: {
        annotations: configureAnnotations(),
        clip: false,
      },
    },
    layout: {
      autoPadding: false,
      padding: {
        right: 0,
        top: 6 * LABEL_PADDING, // Allow for two lines of text above vertical bar
      },
    },
  } as unknown as ChartOptions
})

const chartInstance = composables.useChartJSCommon(
  'bar',
  canvas,
  toRef(props, 'chartData') as Ref<BarChartData>,
  plugins,
  options,
) as Ref<Chart | undefined>

const maxOverflow = computed(() => {
  // Need this reactive dependency to re-compute the max overflow when the chart updates.
  // eslint-disable-next-line no-unused-expressions
  dependsOnChartUpdate.value

  // ChartJS says that labels are optional, but we always provide them.
  const labels = props.chartData.labels as string[]
  const datasets = props.chartData.datasets

  // Determine the maximum annotation width.
  const labelTotals: number[] = labels.map((_, i) => datasets.reduce((acc, ds) => isNaN(Number(ds.data[i])) ? acc : acc + Number(ds.data[i]), 0))

  // If this is the first time we're constructing the chart, we might not have access to the chartInstance yet.
  // This is frustrating, but OK:
  // an initial chart instance doesn't have any hidden datasets, so the calculation will still be correct.
  const fullTotal = chartInstance.value
    ? conditionalDataTotal(chartInstance.value, props.chartData as BarChartData)
    : dataTotal(props.chartData as BarChartData)

  const datasetLengths = labelTotals.map(labelTotal => getTextWidth(formatNumber(labelTotal, unitsRef.value) + drawPercentage(labelTotal, fullTotal)))

  return datasetLengths.reduce((x, acc) => Math.max(x, acc), 0) + LABEL_PADDING
})

onBeforeUnmount(() => {
  Chart.unregister(annotationPlugin)
})

/**
 * When in Preview mode, Chart and Legend are vertically stacked, and the
 * Legend list items are allowed to spread horizontally.
 */
const chartFlexClass: { [label: string]: string } = {
  [ChartLegendPosition.Right]: 'legend-row',
  [ChartLegendPosition.Bottom]: 'column',
}

const axisDimensions = computed(() => {
  if (axis.value && chartInstance.value) {
    const scale = window.devicePixelRatio
    const chart = chartInstance.value

    const width = chart.scales.y.width * scale + AXIS_RIGHT_PADDING // Add 1px to prevent clipping/maintain right border
    const height = (chart.scales.y.height + chart.scales.y.top + chart.scales.x.height) * scale

    const targetCtx = axis.value.getContext('2d') as CanvasRenderingContext2D

    targetCtx.scale(scale, scale)
    targetCtx.canvas.width = width
    targetCtx.canvas.height = height
    targetCtx.canvas.style.width = `${width / scale}px`
    targetCtx.canvas.style.height = `${height / scale}px`

    return {
      scale,
      width: (width * scale),
      height: height * scale,
      targetCtx,
    }
  }

  return null
})

const onScrolling = (event: Event) => {
  if (axisDimensions.value && chartInstance.value) {
    const scale = axisDimensions.value.scale
    const targetCtx = axisDimensions.value.targetCtx
    const width = axisDimensions.value.width
    const height = axisDimensions.value.height
    const chart = chartInstance.value
    const sourceCanvas = chart.canvas
    const target: HTMLElement = event.target as HTMLElement

    targetCtx.fillStyle = 'white'

    if (target.scrollLeft >= SCROLL_MIN && target.scrollLeft <= SCROLL_MAX) {
      // Draw a copy of the area in the chart canvas representing the x-axis
      // on the absolutely positioned canvas which will represent the fixed x-axis
      targetCtx.globalCompositeOperation = 'source-over'
      targetCtx.clearRect(0, 0, width, height)
      targetCtx.drawImage(sourceCanvas, 0, 0, width, height, 0, 0, width, height)

      // Draw white background
      targetCtx.globalCompositeOperation = 'destination-over'
      targetCtx.fillRect(0, 0, width, height)
    } else {
      // Hide any potential slanted labels that sneak into the bottom of the axis
      targetCtx.globalCompositeOperation = 'source-over'
      targetCtx.fillRect(0, (chart.scales.y.height + chart.scales.y.top + AXIS_BOTTOM_OFFSET) * scale, width, (chart.scales.x.height) * scale)

    }

    tooltipData.offset = target.scrollLeft
    axesTooltip.value.offset = target.scrollLeft
  }
}

const tooltipDimensions = ({ width, height }: { width: number, height: number}) => {
  tooltipData.width = width
  tooltipData.height = height
}

watch(() => props.orientation, () => {
  // Cleanup chart when changing orientation
  if (axis.value && axisDimensions.value) {

    const width = axisDimensions.value.width
    const height = axisDimensions.value.height

    const targetCtx = axis.value?.getContext('2d') as CanvasRenderingContext2D
    targetCtx.clearRect(0, 0, width, height)
  }

  tooltipData.showTooltip = false
  tooltipData.locked = false
})

watch(() => props.annotations, (value: boolean) => {
  if (chartInstance.value) {
    if (!value) {
      // @ts-ignore - ChartJS types are incomplete
      delete chartInstance.value.options.plugins.annotation.annotations
    } else {
      // @ts-ignore - ChartJS types are incomplete
      chartInstance.value.options.plugins.annotation.annotations = configureAnnotations(props.chartData as BarChartData)
    }
  }
})

const handleChartClick = () => {
  if (tooltipData.showTooltip) {
    tooltipData.locked = !tooltipData.locked
  }
}

</script>

<style lang="scss" scoped>
@import '../../styles/base';
@import '../../styles/chart';

.chart-container {
  -ms-overflow-style: thin;  /* IE and Edge */
  overflow-y: hidden;
  scrollbar-width: thin;  /* Firefox */

  .chart-body {
    height: 100%;
  }

  &::-webkit-scrollbar-track {
    background-color: $kui-color-background;
    border-radius: 10px;
  }
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: $kui-color-background-disabled;
    border-radius: 10px;
  }
}

.axis {
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  z-index: 99;
}

.axis-tooltip {
  background-color: $kui-color-background-neutral-stronger;
  color: $kui-color-text-inverse;
  padding: $kui-space-20 $kui-space-40;
  position: absolute;
  width: max-content;
  z-index: 100;
}

.tooltip-boundary {
  height: 100%;
  left: 0;
  position: relative;
  top: 0;
  width: 100%;
}
</style>

<template>
  <div
    ref="chartParent"
    class="chart-parent"
    :class="chartFlexClass[legendPosition]"
  >
    <canvas
      :id="axisCanvasId"
      ref="axis"
      class="axis"
    />
    <div
      ref="chartContainer"
      class="chart-container"
      @click="handleChartClick()"
      @scroll="onScrolling"
    >
      <div
        class="chart-body"
        :style="{ width: chartWidth, height: chartHeight }"
      >
        <canvas
          :id="chartCanvasId"
          ref="canvas"
          class="chart-canvas"
        />
      </div>
    </div>
    <Teleport to="body">
      <div
        v-if="axesTooltip.show"
        class="axis-tooltip"
        :style="{ top: axesTooltip.top, left: axesTooltip.left }"
        width="auto"
      >
        <div class="axis-tooltip-content">
          {{ axesTooltip.text }}
        </div>
      </div>
      <ToolTip
        :absolute-left="tooltipAbsoluteLeft"
        :absolute-top="tooltipAbsoluteTop"
        :chart-parent-ref="chartParentRef"
        :state="tooltipData"
        :tooltip-title="tooltipTitle"
        @dimensions="tooltipDimensions"
      />
    </Teleport>
    <ChartLegend
      :id="legendID"
      :chart-instance="chartInstance"
      :items="legendItems"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChartOptions } from 'chart.js'
import { Chart } from 'chart.js'
import type { EventContext } from 'chartjs-plugin-annotation'
import annotationPlugin from 'chartjs-plugin-annotation'
import { ref, toRef, onMounted, computed, reactive, watch, inject, onBeforeUnmount, onUnmounted, useTemplateRef } from 'vue'
import type { Ref } from 'vue'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import ChartLegend from '../chart-plugins/ChartLegend.vue'
import { type BarChartData, generateLegendItems } from '../../utils'
import { accessibleGrey, MAX_LABEL_LENGTH, formatNumber, getTextHeight, getTextWidth, drawPercentage, conditionalDataTotal, debounce } from '../../utils'
import composables from '../../composables'
import { v4 as uuidv4 } from 'uuid'
import { ChartLegendPosition } from '../../enums'
import type { AxesTooltipState, ChartLegendSortFn, ChartTooltipSortFn, EnhancedLegendItem, KChartData, LegendValues, TooltipEntry, TooltipState } from '../../types'
import { HighlightPlugin } from '../chart-plugins/HighlightPlugin'


const props = withDefaults(defineProps<{
  chartData: KChartData
  tooltipTitle?: string
  legendValues?: LegendValues
  metricUnit?: string
  orientation?: 'horizontal' | 'vertical'
  annotations?: boolean
  metricAxesTitle?: string
  dimensionAxesTitle?: string
  stacked?: boolean
  syntheticsDataKey?: string
  chartLegendSortFn?: ChartLegendSortFn
  chartTooltipSortFn?: ChartTooltipSortFn
  tooltipMetricDisplay?: string
}>(), {
  tooltipTitle: '',
  legendValues: undefined,
  metricUnit: '',
  orientation: 'horizontal',
  annotations: true,
  metricAxesTitle: undefined,
  dimensionAxesTitle: undefined,
  stacked: true,
  syntheticsDataKey: '',
  chartLegendSortFn: (a: EnhancedLegendItem, b: EnhancedLegendItem) => a.value && b.value && b.value.raw - a.value.raw,
  chartTooltipSortFn: (a: TooltipEntry, b: TooltipEntry) => b.rawValue - a.rawValue,
  tooltipMetricDisplay: '',
})

const { i18n } = composables.useI18n()
const { translateUnit } = composables.useTranslatedUnits()
const axisCanvasId = crypto.randomUUID()
const chartCanvasId = crypto.randomUUID()
const highlightPlugin = new HighlightPlugin()

// Parameters for bar sizing.
const DEFAULT_CHART_WIDTH = '100%'
const DEFAULT_CHART_HEIGHT = '100%'
const MIN_BAR_WIDTH = 20
const MIN_BAR_HEIGHT = 20
const BAR_MARGIN = 6
const SCROLL_MIN = 0
const SCROLL_MAX = 10
const AXIS_BOTTOM_OFFSET = 10
const AXIS_RIGHT_PADDING = 1

const chartContainerRef = useTemplateRef<HTMLDivElement>('chartContainer')
const chartParentRef = useTemplateRef<HTMLDivElement>('chartParent')

const totalValueOfDataset = ({ chart }: EventContext, label: string) => {
  const chartData: BarChartData = chart.data as BarChartData
  const labelIndex = chartData.labels?.indexOf(label) as number

  return chartData.datasets.reduce<number>((acc: number, current, idx: number) => {
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

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const axisRef = useTemplateRef<HTMLCanvasElement>('axis')
const legendID = uuidv4()
const reactiveAnnotationsID = uuidv4()
const legendItems = ref<EnhancedLegendItem[]>([])
const legendPosition = inject('legendPosition', ChartLegendPosition.Bottom)
const axesTooltip = reactive<AxesTooltipState>({
  show: false,
  top: '0px',
  left: '0px',
  text: '',
  offset: -50, // Avoids App Shell obstruction
})
const unitsRef = toRef(props, 'metricUnit')

const isHorizontal = computed(() => props.orientation === 'horizontal')

const tooltipData = reactive<TooltipState>({
  showTooltip: false,
  tooltipContext: '', // set in tooltipBehaviour
  metricDisplay: props.tooltipMetricDisplay,
  dimensionDisplay: props.dimensionAxesTitle,
  tooltipSeries: [],
  left: '',
  top: '',
  units: props.metricUnit,
  translateUnit,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  interactionMode: 'idle',
  chartType: isHorizontal.value ? 'horizontal_bar' : 'vertical_bar',
  chartID: chartCanvasId,
  chartTooltipSortFn: props.chartTooltipSortFn,
})

const { tooltipAbsoluteLeft, tooltipAbsoluteTop } = composables.useTooltipAbsolutePosition(
  chartParentRef,
  tooltipData,
)

const dependsOnChartUpdate = ref(0)

const configureAnnotations = () => props.annotations && props.chartData.labels?.reduce((acc, label) =>
  Object.assign(acc, makeAnnotations(props.chartData as BarChartData, label, unitsRef.value, props.orientation)),
{},
)

const htmlLegendPlugin = {
  id: legendID,
  afterUpdate(chart: Chart) {
    // Update any computed properties that depend on chart state.
    // As of writing, this is important for correctly calculating maxOverflow based on dataset visibility.
    dependsOnChartUpdate.value += 1

    legendItems.value = generateLegendItems(chart, props.legendValues, props.chartLegendSortFn)
  },
}

const reactiveAnnotationsPlugin = {
  id: reactiveAnnotationsID,
  afterUpdate(chart: Chart) {
    // @ts-ignore - ChartJS types are incomplete
    chart.options.plugins.annotation.annotations = props.annotations ? configureAnnotations() : {}
  },
}

const axesTooltipPlugin = {
  id: 'axisHover',
  // args any because it is not typed by chartjs
  // https://www.chartjs.org/docs/latest/api/interfaces/Plugin.html#parameters
  afterEvent(chart: Chart, args: any) {
    axesTooltip.show = false
    if (args.event.type === 'mousemove') {
      const evt = args.event
      const indexAxis = chart.options.indexAxis as ('x' | 'y')
      const scales = chart.scales
      // @ts-ignore scales['x'] and scales['y'] exist
      const label = chart.scales[indexAxis].getLabelForValue(Number(chart.scales[indexAxis].getValueForPixel(evt[indexAxis])))
      // @ts-ignore scales['x'] and scales['y'] exist
      const labels = chart.scales[indexAxis].getLabels()
      const indexOfLabel = labels.indexOf(label)
      const isEmptyLabel = props.chartData.isLabelEmpty?.[indexOfLabel]
      const compareByIndexAxis = (axis: string) => {
        return axis === 'x'
          // @ts-ignore scales.x exists
          ? evt.y > scales.x.top
          // @ts-ignore scales.y exists
          : evt.x < scales.y.right
      }

      if (compareByIndexAxis(indexAxis)) {
        // Prevent hiding the tooltip if it's locked
        if (tooltipData.interactionMode !== 'interactive') {
          tooltipData.showTooltip = false
        }
        const context = chart.canvas.getContext('2d') as CanvasRenderingContext2D
        const textWidthPixels = context.measureText(label).width

        const leftOfCursor = Math.abs(Math.round(evt.x - textWidthPixels * 0.5))
        const rightOfCursor = Math.round(evt.x + textWidthPixels * 0.5)
        const rect = chart.canvas.getBoundingClientRect()
        const PX_ABOVE_CURSOR = 40
        axesTooltip.left = indexAxis === 'x'
          ? `${(leftOfCursor > 0 ? leftOfCursor : rightOfCursor) - axesTooltip.offset + rect.left}px`
          : `${(evt.x - textWidthPixels * 0.5) - axesTooltip.offset + rect.left}px`
        axesTooltip.top = `${evt.y - PX_ABOVE_CURSOR + rect.top}px`
        if (label.length > MAX_LABEL_LENGTH) {
          axesTooltip.show = true
          axesTooltip.text = label
        } else if (isEmptyLabel) {
          axesTooltip.text = i18n.t('emptyEntityInfo')
          axesTooltip.show = true
        } else {
          axesTooltip.show = false
        }
      } else {
        axesTooltip.show = false
      }
    }
  },
}

const plugins = [
  htmlLegendPlugin,
  axesTooltipPlugin,
  highlightPlugin,
  ...(props.annotations ? [reactiveAnnotationsPlugin] : []),
]

const numLabels = computed(() => {
  return (props.chartData.labels && props.chartData.labels.length) || 0
})

const baseWidth = ref<number>(0)
const baseHeight = ref<number>(0)

const resizeObserver = new ResizeObserver(debounce((entries: ResizeObserverEntry[]) => {
  // Only observing one element
  baseWidth.value = entries[0]?.contentRect.width ?? 0
  baseHeight.value = entries[0]?.contentRect.height ?? 0
}, 100))

const chartWidth = computed<string>(() => {
  const numLabels = props.chartData?.labels?.length
  if (canvasRef.value && numLabels && !isHorizontal.value) {
    const preferredChartWidth = Math.max(numLabels * (MIN_BAR_WIDTH + BAR_MARGIN), baseWidth.value)

    return `${preferredChartWidth}px`
  }

  return DEFAULT_CHART_WIDTH
})

const chartHeight = computed<string>(() => {
  const numLabels = props.chartData?.labels?.length
  if (canvasRef.value && numLabels && isHorizontal.value) {
    const preferredChartHeight = Math.max(numLabels * (MIN_BAR_HEIGHT + BAR_MARGIN), baseHeight.value)

    return `${preferredChartHeight}px`
  }

  return DEFAULT_CHART_HEIGHT
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

  if (chartContainerRef.value) {
    // Initialize base dimensions since resize observer is debounced.
    baseWidth.value = chartContainerRef.value.offsetWidth
    baseHeight.value = chartContainerRef.value.offsetHeight
    resizeObserver.observe(chartContainerRef.value)
  }
})

onUnmounted(() => {
  if (chartContainerRef.value) {
    resizeObserver.unobserve(chartContainerRef.value)
  }
})

const options = computed<ChartOptions>(() => {
  const defaultOptions = composables.useBarChartOptions({
    tooltipState: tooltipData,
    legendID,
    stacked: toRef(props, 'stacked'),
    metricAxesTitle: toRef(props, 'metricAxesTitle'),
    dimensionAxesTitle: toRef(props, 'dimensionAxesTitle'),
    indexAxis: isHorizontal.value ? 'y' : 'x',
    numLabels,
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
  } as unknown as ChartOptions
})

const chartInstance = composables.useChartJSCommon(
  'bar',
  canvasRef,
  toRef(props, 'chartData'),
  plugins,
  options,
) as Ref<Chart | undefined>

onBeforeUnmount(() => {
  Chart.unregister(annotationPlugin)
})

/**
 * When in Preview mode, Chart and Legend are vertically stacked, and the
 * Legend list items are allowed to spread horizontally.
 */
const chartFlexClass: { [label: string]: string } = {
  [ChartLegendPosition.Bottom]: 'column',
}

const axisDimensions = computed(() => {
  if (axisRef.value && chartInstance.value) {
    const scale = window.devicePixelRatio
    const chart = chartInstance.value

    if (!chart.scales.x || !chart.scales.y) {
      return null
    }

    const width = chart.scales.y.width * scale + AXIS_RIGHT_PADDING // Add 1px to prevent clipping/maintain right border
    const height = (chart.scales.y.height + chart.scales.y.top + chart.scales.x.height) * scale

    const targetCtx = axisRef.value.getContext('2d') as CanvasRenderingContext2D

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
  const target = event.target as HTMLElement
  if (axisDimensions.value && chartInstance.value && !isHorizontal.value) {
    const scale = axisDimensions.value.scale
    const targetCtx = axisDimensions.value.targetCtx
    const width = axisDimensions.value.width
    const height = axisDimensions.value.height
    const chart = chartInstance.value
    const sourceCanvas = chart.canvas

    if (!chart.scales.x || !chart.scales.y) {
      return
    }

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
  }

  tooltipData.offsetY = target.scrollTop
  tooltipData.offsetX = target.scrollLeft
  axesTooltip.offset = target.scrollLeft
}

const tooltipDimensions = ({ width, height }: { width: number, height: number }) => {
  tooltipData.width = width
  tooltipData.height = height
}

watch(() => props.orientation, () => {
  // Cleanup chart when changing orientation
  if (axisRef.value && axisDimensions.value) {

    const width = axisDimensions.value.width
    const height = axisDimensions.value.height

    const targetCtx = axisRef.value?.getContext('2d') as CanvasRenderingContext2D
    targetCtx.clearRect(0, 0, width, height)
  }

  tooltipData.showTooltip = false
  tooltipData.interactionMode = 'idle'
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

    if (tooltipData.interactionMode !== 'idle') {
      tooltipData.interactionMode = 'idle'
    } else {
      tooltipData.interactionMode = 'interactive'
    }
  }
}
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";

.chart-container {
  overflow: auto;

  // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
  // stylelint-disable-next-line no-duplicate-selectors
  & {
    @include scrollbarBase;
  }

  .chart-body {
    height: 100%;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--kui-color-background, $kui-color-background);
    border-radius: var(--kui-border-radius-50, $kui-border-radius-50);
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--kui-color-background-disabled, $kui-color-background-disabled);
    border-radius: var(--kui-border-radius-50, $kui-border-radius-50);
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
  background-color: var(--kui-color-background-inverse, $kui-color-background-inverse);
  border: none;
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  color: var(--kui-color-text-inverse, $kui-color-text-inverse);
  max-width: 40ch;
  padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
  position: absolute;
  width: max-content;
  z-index: 100;

  .axis-tooltip-content {
    color: var(--kui-color-text-inverse, $kui-color-text-inverse);
    font-family: var(--kui-font-family-text, $kui-font-family-text);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
  }
}

.tooltip-boundary {
  height: 100%;
  left: 0;
  position: relative;
  top: 0;
  width: 100%;
}
</style>

<template>
  <div
    ref="chartParent"
    class="chart-parent"
    :class="chartFlexClass(legendPosition)"
    data-testid="scatter-chart-parent"
  >
    <div class="chart-container">
      <Scatter
        :key="remountKey"
        ref="chartInstance"
        :chart-id="chartID"
        class="chart-canvas"
        :data="(chartData as any)"
        data-testid="scatter-chart"
        :options="(options as any)"
        :plugins="plugins as Plugin<'scatter'>[]"
      />
    </div>
    <ToolTip
      :absolute-left="tooltipAbsoluteLeft"
      :absolute-top="tooltipAbsoluteTop"
      data-testid="tooltip"
      :granularity="granularity"
      :state="tooltipData"
      :tooltip-title="tooltipTitle"
    />
    <ChartLegend
      :id="legendID"
      :chart-instance="chartInstance"
      data-testid="legend"
      :items="allLegendItems"
    />
  </div>
</template>

<script setup lang="ts">
import type { Chart, Plugin } from 'chart.js'
import type { ComputedRef } from 'vue'
import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import type { ChartLegendSortFn, ChartTooltipSortFn, EnhancedLegendItem, KChartData, TooltipState } from '../../types'
import type { ScatterChartColors } from '../../utils'

import { computed, inject, onMounted, reactive, ref, toRef, useTemplateRef, watch } from 'vue'
import { Scatter } from 'vue-chartjs'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'

import 'chartjs-adapter-date-fns'
import 'chart.js/auto'

import composables from '../../composables'
import { ChartLegendPosition } from '../../enums'
import { generateLegendItems, scatterChartColors } from '../../utils'
import { OutlierBandPlugin } from '../chart-plugins/OutlierBandPlugin'
import { ReferenceLinePlugin } from '../chart-plugins/ReferenceLinePlugin'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import ChartLegend from '../chart-plugins/ChartLegend.vue'

interface ScatterChartProps {
  chartData?: KChartData
  tooltipTitle: string
  metricUnit?: string
  granularity: GranularityValues
  timeRangeMs?: number
  metricAxesTitle?: string
  dimensionAxesTitle?: string
  syntheticsDataKey?: string
  chartLegendSortFn?: ChartLegendSortFn
  chartTooltipSortFn?: ChartTooltipSortFn
  tooltipMetricDisplay?: string
  shadeOutlierRegion?: boolean
}

const props = withDefaults(
  defineProps<ScatterChartProps>(),
  {
    chartData: undefined,
    metricUnit: '',
    timeRangeMs: undefined,
    metricAxesTitle: undefined,
    dimensionAxesTitle: undefined,
    syntheticsDataKey: '',
    chartLegendSortFn: () => 0,
    chartTooltipSortFn: (a, b) => b.rawValue - a.rawValue,
    tooltipMetricDisplay: '',
    shadeOutlierRegion: false,
  },
)

const legendPosition = inject('legendPosition', ChartLegendPosition.Bottom)
const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))

const { i18n } = composables.useI18n()
const { formatUnit } = unitFormatter({ i18n })
const { translateUnit } = composables.useTranslatedUnits()

const chartParentRef = useTemplateRef<HTMLDivElement>('chartParent')

const outlierBandPlugin = new OutlierBandPlugin()
const referenceLinePlugin = new ReferenceLinePlugin()
const legendID = crypto.randomUUID()
const chartID = crypto.randomUUID()

const themeColors = ref<ScatterChartColors>(scatterChartColors())
const chartInstance = ref<{ chart: Chart }>()

const tooltipData: TooltipState = reactive({
  showTooltip: false,
  tooltipContext: 0,
  metricDisplay: toRef(props, 'tooltipMetricDisplay'),
  tooltipSeries: [],
  left: '',
  top: '',
  units: toRef(props, 'metricUnit'),
  translateUnit,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartType: 'scatter',
  chartID,
  chartTooltipSortFn: props.chartTooltipSortFn,
  interactionMode: 'idle',
})

const { tooltipAbsoluteLeft, tooltipAbsoluteTop } = composables.useTooltipAbsolutePosition(
  chartParentRef,
  tooltipData,
)

composables.useReportChartDataForSynthetics(toRef(props, 'chartData'), toRef(props, 'syntheticsDataKey'))

onMounted(() => {
  themeColors.value = scatterChartColors(chartParentRef.value)
})

watch(activeColorMode, () => {
  themeColors.value = scatterChartColors(chartParentRef.value)
})

const outlier = computed(() => props.chartData?.outlier)
const referenceLines = computed(() => props.chartData?.referenceLines ?? [])

const datasetLegendItems = ref<EnhancedLegendItem[]>([])

const htmlLegendPlugin: Plugin = {
  id: legendID,
  afterUpdate(chart: Chart) {
    datasetLegendItems.value = generateLegendItems(chart, undefined, props.chartLegendSortFn)
  },
}

/**
 * These are not associated with a dataset and are not toggle'able, they are simply
 * key entries for the chart, e.g. percentile lines, outliers, etc.
 */
const keyLegendItems = computed<EnhancedLegendItem[]>(() => {
  const items: EnhancedLegendItem[] = []

  if (outlier.value) {
    items.push({
      text: outlier.value.label,
      fillStyle: outlier.value.color,
      strokeStyle: outlier.value.color,
      isKey: true,
    } as EnhancedLegendItem)
  }

  for (const line of referenceLines.value) {
    items.push({
      text: line.label,
      fillStyle: line.color,
      strokeStyle: line.color,
      lineDash: line.borderDash,
      isKey: true,
      value: {
        raw: line.value,
        formatted: formatUnit(line.value, props.metricUnit, { translateUnit }),
      },
    } as EnhancedLegendItem)
  }

  return items
})

const allLegendItems = computed(() => [...datasetLegendItems.value, ...keyLegendItems.value])

const outlierBandValue = computed(() => (
  props.shadeOutlierRegion ? outlier.value?.value : undefined
))

const plugins = computed(() => [
  htmlLegendPlugin,
  ...(outlierBandValue.value !== undefined ? [outlierBandPlugin] : []),
  ...(referenceLines.value.length ? [referenceLinePlugin] : []),
])

const remountKey = computed(() => `scatter-${plugins.value.map(p => p.id).join('-')}`)

const { options } = composables.useScatterChartOptions({
  tooltipState: tooltipData,
  legendID,
  granularity: toRef(props, 'granularity'),
  timeRangeMs: toRef(props, 'timeRangeMs'),
  metricAxesTitle: toRef(props, 'metricAxesTitle'),
  dimensionAxesTitle: toRef(props, 'dimensionAxesTitle'),
  metricUnit: toRef(props, 'metricUnit'),
  outlierValue: outlierBandValue,
  referenceLines,
  themeColors,
})

const chartFlexClass = (position: `${ChartLegendPosition}`) => {
  return {
    [ChartLegendPosition.Bottom]: 'column',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[position]
}
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";
</style>

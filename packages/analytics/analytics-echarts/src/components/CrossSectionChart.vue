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
        @datazoom="handleDataZoom"
        @zr:click="handleClick"
        @zr:mousemove="handleMouseMove"
        @zr:mouseout="handleMouseOut"
      >
        <ChartTooltip
          ref="tooltip"
          :state="tooltipState"
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
import { computed, toRef, watch } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import {
  defaultStatusCodeColors,
  getDimensionAxisTitle,
  getMetricAxisTitle,
  getMetricUnit,
  getTooltipMetricDisplay,
  normalizeDataZoomWindow,
  type DataZoomPayload,
} from '../utils'
import type {
  AnalyticsChartColors,
  ChartScrollWindow,
  ChartLegendSortFn,
  ChartTooltipSortFn,
  LegendPosition,
} from '../types'
import AnalyticsChartShell from './AnalyticsChartShell.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'
import ChartLegend from './ChartLegend.vue'
import ChartTooltip from './ChartTooltip.vue'

const {
  data,
  type,
  stacked = false,
  colorPalette,
  tooltipTitle,
  emptyStateTitle,
  emptyStateDescription,
  metricAxesTitle,
  dimensionAxesTitle,
  showAnnotations = true,
  showLegendValues = false,
  legendPosition = 'bottom',
  chartLegendSortFn,
  chartTooltipSortFn,
  hideTruncationWarning = false,
  theme = 'light',
  renderMode = 'svg',
} = defineProps<{
  data: ExploreResultV4
  type: 'horizontal_bar' | 'vertical_bar' | 'donut'
  stacked?: boolean
  colorPalette?: string[] | AnalyticsChartColors
  tooltipTitle?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  metricAxesTitle?: string
  dimensionAxesTitle?: string
  showAnnotations?: boolean
  showLegendValues?: boolean
  legendPosition?: LegendPosition
  chartLegendSortFn?: ChartLegendSortFn
  chartTooltipSortFn?: ChartTooltipSortFn
  hideTruncationWarning?: boolean
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const { i18n } = composables.useI18n()

const chartData = composables.useCrossSectionalChartData({
  colorPalette: computed(() => colorPalette || defaultStatusCodeColors),
}, toRef(() => data))

const metricUnit = computed(() => getMetricUnit(
  data.meta?.metric_units,
  data.meta?.metric_names?.[0],
))

const { selectedLabels, toggleLegendItem } = composables.useChartLabelSelection(chartData)
const chartLabels = computed(() => chartData.value.labels || [])
let latestScrollWindow: ChartScrollWindow | null = null
const optionScrollWindow = toRef(() => latestScrollWindow)

const {
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

const {
  tooltipState,
  handleTooltipMouseMove,
  handleTooltipClick,
  handleTooltipMouseOut,
  resetTooltipState,
} = composables.useEchartsTooltipController({
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
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

const primaryDimension = computed(() => {
  return Object.keys(data.meta?.display || {})[0] || data.meta?.metric_names?.[0]
})

const dimensionAxisTitle = computed(() => {
  return getDimensionAxisTitle({
    i18n,
    dimensionAxesTitle,
    dimension: primaryDimension.value,
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

const { option } = composables.useCrossSectionalChartOption({
  chartData,
  chartType: toRef(() => type),
  chartWidth,
  chartHeight,
  scrollWindow: optionScrollWindow,
  showAnnotations: toRef(() => showAnnotations),
  stacked: toRef(() => stacked),
  metricUnit,
  tooltipTitle: toRef(() => tooltipTitle),
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn: frameChartTooltipSortFn,
  tooltipState,
})

const hasValidChartData = computed(() => {
  return data && data.meta && data.data.length > 0 && chartData.value.datasets.length > 0
})

const handleMouseMove = handleTooltipMouseMove
const handleClick = handleTooltipClick
const handleMouseOut = handleTooltipMouseOut

const handleDataZoom = (payload: DataZoomPayload) => {
  if (type === 'donut') {
    return
  }

  const scrollWindow = normalizeDataZoomWindow(payload, chartLabels.value.length)

  if (!scrollWindow) {
    return
  }

  latestScrollWindow = scrollWindow
}

watch([() => data, () => type], () => {
  latestScrollWindow = null
})

</script>

<style scoped lang="scss">
@use "../styles/chart";
</style>

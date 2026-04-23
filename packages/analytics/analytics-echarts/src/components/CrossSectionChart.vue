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
        :position="props.legendPosition"
        :show-values="props.showLegendValues"
        @toggle="toggleLegendItem"
      />
    </div>
  </AnalyticsChartShell>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import {
  createStoredScrollWindow,
  datavisPalette,
  getDimensionAxisTitle,
  getMetricAxisTitle,
  getMetricUnit,
  getTooltipMetricDisplay,
  normalizeDataZoomWindow,
  resolveCrossSectionViewportState,
} from '../utils'
import type {
  AnalyticsChartColors,
  ChartLegendSortFn,
  ChartTooltipSortFn,
  LegendPosition,
} from '../types'
import type { StoredChartScrollWindow } from '../utils'
import AnalyticsChartShell from './AnalyticsChartShell.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'
import ChartLegend from './ChartLegend.vue'
import ChartTooltip from './ChartTooltip.vue'

const props = withDefaults(defineProps<{
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
}>(), {
  stacked: false,
  colorPalette: undefined,
  tooltipTitle: undefined,
  emptyStateTitle: undefined,
  emptyStateDescription: undefined,
  metricAxesTitle: undefined,
  dimensionAxesTitle: undefined,
  showAnnotations: true,
  showLegendValues: false,
  legendPosition: 'bottom',
  chartLegendSortFn: undefined,
  chartTooltipSortFn: undefined,
  hideTruncationWarning: false,
  theme: 'light',
  renderMode: 'svg',
})

const { i18n } = composables.useI18n()

const chartData = composables.useCrossSectionalChartData({
  colorPalette: computed(() => props.colorPalette || datavisPalette),
}, toRef(props, 'data'))

const metricUnit = computed(() => getMetricUnit(
  props.data.meta?.metric_units,
  props.data.meta?.metric_names?.[0],
))

const { selectedLabels, toggleLegendItem } = composables.useChartLabelSelection(chartData)
const scrollWindow = ref<StoredChartScrollWindow | null>(null)
const chartLabels = computed(() => chartData.value.labels || [])

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
  data: toRef(props, 'data'),
  chartData,
  metricUnit,
  selectedLabels,
  legendPosition: toRef(props, 'legendPosition'),
  chartLegendSortFn: toRef(props, 'chartLegendSortFn'),
  chartTooltipSortFn: toRef(props, 'chartTooltipSortFn'),
  hideTruncationWarning: toRef(props, 'hideTruncationWarning'),
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
    metricName: props.data.meta?.metric_names?.[0],
    metricUnit: metricUnit.value,
    metricAxesTitle: props.metricAxesTitle,
    metricCount: props.data.meta?.metric_names?.length || 0,
  })
})

const primaryDimension = computed(() => {
  return Object.keys(props.data.meta?.display || {})[0] || props.data.meta?.metric_names?.[0]
})

const dimensionAxisTitle = computed(() => {
  return getDimensionAxisTitle({
    i18n,
    dimensionAxesTitle: props.dimensionAxesTitle,
    dimension: props.type === 'donut' ? primaryDimension.value : primaryDimension.value,
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

const { option } = composables.useCrossSectionalChartOption({
  chartData,
  chartType: toRef(props, 'type'),
  chartWidth,
  chartHeight,
  scrollWindow,
  showAnnotations: toRef(props, 'showAnnotations'),
  stacked: toRef(props, 'stacked'),
  metricUnit,
  tooltipTitle: toRef(props, 'tooltipTitle'),
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn: frameChartTooltipSortFn,
  tooltipState,
})

const hasValidChartData = computed(() => {
  return props.data && props.data.meta && props.data.data.length > 0 && chartData.value.datasets.length > 0
})

const handleMouseMove = (event: any) => {
  handleTooltipMouseMove(event)
}

const handleClick = () => {
  handleTooltipClick()
}

const handleMouseOut = () => {
  handleTooltipMouseOut()
}

const handleDataZoom = (payload: {
  startValue?: number | string
  endValue?: number | string
  batch?: Array<{ startValue?: number | string, endValue?: number | string }>
}) => {
  const nextWindow = normalizeDataZoomWindow(payload)

  if (nextWindow) {
    scrollWindow.value = createStoredScrollWindow({
      labels: chartData.value.labels || [],
      scrollWindow: nextWindow,
    })
  }
}

watch([
  () => props.type,
  chartWidth,
  chartHeight,
  chartLabels,
], ([chartType, width, height, labels]) => {
  if (chartType === 'donut') {
    scrollWindow.value = null

    return
  }

  const { storedScrollWindow } = resolveCrossSectionViewportState({
    chartType,
    chartWidth: width,
    chartHeight: height,
    labels,
    scrollWindow: scrollWindow.value,
  })

  scrollWindow.value = storedScrollWindow
}, { immediate: true })


</script>

<style scoped lang="scss">
@use "../styles/chart";
</style>

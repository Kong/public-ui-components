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
        @zr:click="handleClick"
        @zr:mousemove="handleMouseMove"
        @zr:mouseout="handleMouseOut"
      >
        <ChartTooltip
          ref="tooltip"
          :state="tooltipState"
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
import { computed, ref, toRef, useTemplateRef } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { useElementBounding, useElementSize } from '@vueuse/core'
import composables from '../composables'
import {
  createDefaultChartLegendSort,
  createDefaultChartTooltipSort,
  datavisPalette,
  getDimensionAxisTitle,
  getMetricAxisTitle,
  getMetricUnit,
  getTooltipMetricDisplay,
} from '../utils'
import type {
  AnalyticsChartColors,
  ChartLegendSortFn,
  ChartTooltipSortFn,
  LegendPosition,
  TooltipState,
} from '../types'
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
  showLegendValues: false,
  legendPosition: 'bottom',
  chartLegendSortFn: undefined,
  chartTooltipSortFn: undefined,
  hideTruncationWarning: false,
  theme: 'light',
  renderMode: 'svg',
})

const { i18n } = composables.useI18n()
const tooltipState = ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const baseChartRef = useTemplateRef('baseChart')
const tooltipRef = useTemplateRef('tooltip')

const chartRef = computed(() => baseChartRef.value?.getChart())
const containerRef = computed(() => baseChartRef.value?.getContainer())
const chartEl = computed(() => chartRef.value?.$el as HTMLElement | undefined)

const { width: chartWidth, height: chartHeight } = useElementSize(chartEl)
const { top: containerTop, left: containerLeft } = useElementBounding(containerRef)

const tooltipWidth = computed(() => tooltipRef.value?.width)
const tooltipHeight = computed(() => tooltipRef.value?.height)

const chartData = composables.useExploreResultToDatasets({
  colorPalette: computed(() => props.colorPalette || datavisPalette),
}, toRef(props, 'data'))

const metricUnit = computed(() => getMetricUnit(
  props.data.meta?.metric_units,
  props.data.meta?.metric_names?.[0],
))

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

const defaultLegendSort = computed(() => createDefaultChartLegendSort(i18n.t('chartLabels.____OTHER____')))
const defaultTooltipSort = computed(() => createDefaultChartTooltipSort(i18n.t('chartLabels.____OTHER____')))
const chartLegendSortFn = computed(() => props.chartLegendSortFn || defaultLegendSort.value)
const chartTooltipSortFn = computed(() => props.chartTooltipSortFn || defaultTooltipSort.value)

const { selectedLabels, toggleLegendItem } = composables.useChartLabelSelection(chartData)

const { legendValues } = composables.useChartLegendValues(chartData, metricUnit)

const chartFlexClass = computed(() => {
  return props.legendPosition === 'bottom' ? 'column' : undefined
})

const legendItems = computed(() => {
  return chartData.value.datasets.map(dataset => ({
    label: dataset.label || '',
    color: dataset.backgroundColor || dataset.borderColor || '#000',
    borderColor: dataset.borderColor || dataset.backgroundColor || '#000',
    value: legendValues.value[dataset.label || ''],
    isSegmentEmpty: dataset.isSegmentEmpty,
    hidden: selectedLabels.value[dataset.label || ''] === false,
  })).sort(chartLegendSortFn.value)
})

const { option } = composables.useExploreResultToEChartCrossSectional({
  chartData,
  chartType: toRef(props, 'type'),
  stacked: toRef(props, 'stacked'),
  metricUnit,
  tooltipTitle: toRef(props, 'tooltipTitle'),
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn,
  tooltipState,
})

const maxEntitiesShown = computed(() => props.data.meta?.limit?.toString() || null)
const resultSetTruncated = computed(() => {
  return props.hideTruncationWarning ? false : props.data.meta?.truncated || false
})
const hasValidChartData = computed(() => {
  return props.data && props.data.meta && props.data.data.length > 0 && chartData.value.datasets.length > 0
})

const { calculatePosition } = composables.useTooltipPosition({
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
})

const isInteractive = computed(() => tooltipState.value.interactionMode === 'interactive')

const handleMouseMove = (event: any) => {
  if (!isInteractive.value) {
    const pos = calculatePosition(event)

    if (pos) {
      tooltipState.value.left = pos.left
      tooltipState.value.top = pos.top
    }
  }
}

const handleClick = () => {
  if (tooltipState.value.interactionMode !== 'idle') {
    tooltipState.value.interactionMode = 'idle'
    tooltipState.value.visible = false
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

<style scoped lang="scss">
@use "../styles/chart";
</style>

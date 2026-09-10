<template>
  <div
    class="analytics-chart-shell"
    :class="{
      'show-values': showLegendValues,
    }"
  >
    <div
      v-if="hasValidChartData && resultSetTruncated && maxEntitiesShown"
      class="chart-truncation-warning"
      data-testid="truncation-warning"
    >
      <KTooltip
        class="tooltip"
        max-width="500"
        placement="right"
      >
        <WarningIcon
          :color="`var(--kui-color-text-warning, ${KUI_COLOR_TEXT_WARNING})`"
          :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
        />
        <template #content>
          <div class="tooltip-content">
            {{ notAllDataShownTooltipContent }}
          </div>
        </template>
      </KTooltip>
    </div>
    <KEmptyState
      v-if="!hasValidChartData"
      :action-button-visible="false"
      class="chart-empty-state"
      data-testid="no-data-in-report"
    >
      <template #title>
        {{ emptyStateTitle }}
      </template>
      <template #default>
        {{ emptyStateDescription }}
      </template>
    </KEmptyState>
    <div
      v-else
      class="analytics-chart-parent"
    >
      <TimeSeriesChart
        v-if="isTimeSeriesChart"
        :brush="canBrush"
        :chart-data="computedChartData"
        :chart-legend-sort-fn="chartLegendSortFn"
        :chart-tooltip-sort-fn="chartTooltipSortFn"
        :dimension-axes-title="timestampAxisTitle"
        :fill="chartOptions.stacked"
        :granularity="timeSeriesGranularity"
        :legend-values="legendValues"
        :metric-axes-title="metricAxesTitle"
        :metric-unit="computedMetricUnit"
        :stacked="chartOptions.stacked"
        :synthetics-data-key="syntheticsDataKey"
        :threshold="selectedThreshold"
        :time-range-ms="timeRangeMs"
        :tooltip-metric-display="tooltipMetricDisplay"
        :tooltip-title="tooltipTitle"
        :type="(chartOptions.type as ('timeseries_line' | 'timeseries_bar'))"
        :zoom-action-items="zoomActionItems"
        @select-chart-range="emit('select-chart-range', $event)"
        @zoom-time-range="(newTimeRange: AbsoluteTimeRangeV4) => emit('zoom-time-range', newTimeRange)"
      />
      <StackedBarChart
        v-else-if="isBarChart"
        :annotations="showAnnotations"
        :chart-data="computedChartData"
        :chart-legend-sort-fn="chartLegendSortFn"
        :chart-tooltip-sort-fn="chartTooltipSortFn"
        data-testid="bar-chart-container"
        :dimension-axes-title="dimensionAxesTitle"
        :legend-values="legendValues"
        :metric-axes-title="metricAxesTitle"
        :metric-unit="computedMetricUnit"
        :orientation="barChartOrientation"
        :stacked="chartOptions.stacked"
        :synthetics-data-key="syntheticsDataKey"
        :tooltip-metric-display="tooltipMetricDisplay"
        :tooltip-title="tooltipTitle"
      />
      <DonutChart
        v-else-if="isDonutChart"
        :chart-data="computedChartData"
        :dataset-colors="chartOptions.chartDatasetColors || defaultStatusCodeColors"
        :legend-position="legendPosition"
        :legend-values="legendValues"
        :metric-name="computedMetricName"
        :metric-unit="computedMetricUnit"
        :show-center-metric="chartOptions.showCenterMetric"
        :synthetics-data-key="syntheticsDataKey"
        :tooltip-dimension-display="dimensionAxesTitle"
        :tooltip-metric-display="tooltipMetricDisplay"
        :tooltip-title="tooltipTitle"
      />
      <ScatterChart
        v-else-if="isScatterChart"
        :chart-data="computedChartData"
        :chart-legend-sort-fn="chartOptions.chartLegendSortFn"
        :chart-tooltip-sort-fn="chartTooltipSortFn"
        data-testid="scatter-chart-container"
        :dimension-axes-title="timestampAxisTitle"
        :granularity="scatterGranularity"
        :legend-values="legendValues"
        :metric-axes-title="metricAxesTitle"
        :metric-unit="computedMetricUnit"
        :shade-outlier-region="chartOptions.scatter?.shadeOutlierRegion"
        :synthetics-data-key="syntheticsDataKey"
        :time-range-ms="timeRangeMs"
        :tooltip-metric-display="tooltipMetricDisplay"
        :tooltip-title="tooltipTitle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue'
import type { AnalyticsChartOptions, EnhancedLegendItem, ExternalLink, ScatterChartData, SharedMeta, TooltipEntry, ZoomActionItem } from '../types'
import type { AbsoluteTimeRangeV4, AllAggregations, ExploreResultV4, GranularityValues } from '@kong-ui-public/analytics-utilities'

import { computed, provide, toRef } from 'vue'
import { isPlatformDatasource, msToGranularity } from '@kong-ui-public/analytics-utilities'
import { KUI_COLOR_TEXT_WARNING, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { WarningIcon } from '@kong/icons'

import {
  hasMillisecondTimestamps,
  defaultStatusCodeColors,
  exploreResultToScatterData,
  isNoSuffixMetric,
} from '../utils'
import composables from '../composables'
import { isScatterChartData } from '../types'
import { ChartLegendPosition } from '../enums'

import StackedBarChart from './chart-types/StackedBarChart.vue'
import DonutChart from './chart-types/DonutChart.vue'
import ScatterChart from './chart-types/ScatterChart.vue'
import TimeSeriesChart from './chart-types/TimeSeriesChart.vue'

interface ChartProps {
  chartData: ExploreResultV4 | ScatterChartData
  chartOptions: AnalyticsChartOptions
  /** Only used for time-series charts with multiple metrics and a group-by dimension. */
  activeMetric?: AllAggregations
  tooltipTitle?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  legendPosition?: `${ChartLegendPosition}`
  syntheticsDataKey?: string
  showLegendValues?: boolean
  showAnnotations?: boolean
  timeseriesZoom?: boolean
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
}

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const props = withDefaults(defineProps<ChartProps>(), {
  activeMetric: undefined,
  tooltipTitle: '',
  emptyStateTitle: '',
  emptyStateDescription: '',
  legendPosition: ChartLegendPosition.Bottom,
  syntheticsDataKey: '',
  showLegendValues: false,
  showAnnotations: true,
  timeseriesZoom: false,
  requestsLink: undefined,
  exploreLink: undefined,
})

const { i18n } = composables.useI18n()

const exploreData = computed<ExploreResultV4 | undefined>(() => (
  isScatterChartData(props.chartData) ? undefined : props.chartData
))

// A grouped time series shows one metric at a time; other chart modes keep the full query.
const selectableMetrics = computed(() => {
  const meta = exploreData.value?.meta
  const metrics = meta?.metric_names ?? []
  const isTimeSeries = ['timeseries_line', 'timeseries_bar'].includes(props.chartOptions.type)

  return isTimeSeries && metrics.length > 1 && Object.keys(meta?.display ?? {}).length > 0 ? metrics : []
})
const hasGroupedMetrics = computed(() => selectableMetrics.value.length > 1)
const selectedMetric = computed(() => props.activeMetric && selectableMetrics.value.includes(props.activeMetric)
  ? props.activeMetric
  : selectableMetrics.value[0])

const displayedExploreData = computed<ExploreResultV4 | undefined>(() => {
  const result = exploreData.value

  if (!result || !hasGroupedMetrics.value || !selectedMetric.value) {
    return result
  }

  return {
    ...result,
    meta: { ...result.meta, metric_names: [selectedMetric.value] },
  }
})

const selectedThreshold = computed(() => {
  const thresholds = props.chartOptions.threshold

  if (!hasGroupedMetrics.value || !thresholds) {
    return thresholds
  }

  return {
    ...thresholds,
    ...Object.fromEntries(Object.keys(thresholds)
      .filter(metric => metric !== selectedMetric.value)
      .map(metric => [metric, []])),
  }
})

const scatterData = computed<ScatterChartData | undefined>(() => {
  if (!isScatterChart.value) {
    return undefined
  }

  return isScatterChartData(props.chartData) ? props.chartData : exploreResultToScatterData(props.chartData)
})

const chartMeta = computed<SharedMeta>(() => {
  if (isScatterChartData(props.chartData)) {
    const { start, end, metric, metricUnit, truncated, limit, datasource } = props.chartData

    return {
      start,
      end,
      metricNames: [metric],
      metricUnits: { [metric]: metricUnit ?? '' },
      truncated,
      limit,
      datasource,
    }
  }

  const meta = displayedExploreData.value?.meta

  return {
    start: meta?.start,
    end: meta?.end,
    metricNames: meta?.metric_names,
    metricUnits: meta?.metric_units,
    truncated: meta?.truncated,
    limit: meta?.limit,
    datasource: meta?.datasource,
  }
})

const computedChartData = computed(() => {
  if (isScatterChart.value) {
    return composables.useScatterDatasets(
      {
        colorPalette: props.chartOptions.chartDatasetColors,
        scatter: props.chartOptions.scatter,
      },
      scatterData,
    ).value
  }

  if (!exploreData.value) {
    return { datasets: [] }
  }

  return isTimeSeriesChart.value
    ? composables.useExploreResultToTimeDataset(
      {
        fill: props.chartOptions.stacked,
        colorPalette: props.chartOptions.chartDatasetColors || defaultStatusCodeColors,
      },
      displayedExploreData as ComputedRef<ExploreResultV4>,
    ).value
    : composables.useExploreResultToDatasets(
      {
        fill: props.chartOptions.stacked,
        colorPalette: props.chartOptions.chartDatasetColors || defaultStatusCodeColors,
      },
      exploreData as ComputedRef<ExploreResultV4>,
    ).value
})

const canBrush = computed(() => {
  return props.timeseriesZoom || !!props.exploreLink || !!props.requestsLink
})

const timeRangeMs = computed<number | undefined>(() => {
  if (!props.chartData || (exploreData.value && !exploreData.value.meta)) {
    return 0
  }

  const { start, end } = chartMeta.value

  if (start && end) {
    return new Date(end).getTime() - new Date(start).getTime()
  }

  return undefined
})

const computedMetricUnit = computed<string>(() => {
  if (!chartMeta.value.metricUnits) {
    return ''
  }

  return hasGroupedMetrics.value && selectedMetric.value
    ? chartMeta.value.metricUnits[selectedMetric.value] ?? ''
    : Object.values(chartMeta.value.metricUnits)[0] ?? ''
})

const computedMetricName = computed<string>(() => {
  if (!chartMeta.value.metricUnits) {
    return ''
  }

  return hasGroupedMetrics.value && selectedMetric.value
    ? selectedMetric.value
    : Object.keys(chartMeta.value.metricUnits)[0] ?? ''
})

const showLegendValues = computed(() => props.showLegendValues && props.legendPosition !== ChartLegendPosition.Hidden)

const { legendValues } = composables.useChartLegendValues(computedChartData, props.chartOptions.type, computedMetricUnit)

const maxEntitiesShown = computed(() => chartMeta.value.limit?.toString() || null)
const resultSetTruncated = computed(() => {
  return props.chartOptions.hideTruncationWarning
    ? false
    : chartMeta.value.truncated || false
})
const notAllDataShownTooltipContent = computed(() => i18n.t('limitedResultsShown', { maxReturned: maxEntitiesShown.value }))
const isBarChart = computed<boolean>(() => [
  'vertical_bar',
  'horizontal_bar',
].includes(props.chartOptions.type))
const isTimeSeriesChart = computed<boolean>(() => {
  return ['timeseries_bar', 'timeseries_line'].some(e => e === props.chartOptions.type)
})
const isDonutChart = computed<boolean>(() => props.chartOptions.type === 'donut')
const isScatterChart = computed<boolean>(() => props.chartOptions.type === 'scatter')

const barChartOrientation = computed<'horizontal' | 'vertical'>(() => props.chartOptions.type.includes('vertical') ? 'vertical' : 'horizontal')

const tooltipMetricDisplay = computed<string | undefined>(() => {
  const { metricNames, metricUnits } = chartMeta.value

  if (!metricNames || !metricUnits) {
    return undefined
  }

  const metricName = metricNames[0]
  const metricUnit = metricUnits[metricName] || ''

  if (metricNames.length > 1) {
    if (metricName.includes('latency')) {
      // @ts-ignore - dynamic i18n key
      return i18n.t('metricAxisTitles.latency_in', { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) })
    }
    if (metricName.includes('size')) {
      // @ts-ignore - dynamic i18n key
      return i18n.t('metricAxisTitles.size_in', { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) })
    }
  }

  if (!metricName) {
    return undefined
  }

  // @ts-ignore - dynamic i18n key
  if (isNoSuffixMetric(metricUnit) && i18n.te(`metricAxisTitles.${metricName}`)) {
    // @ts-ignore - dynamic i18n key
    return i18n.t(`metricAxisTitles.${metricName}`) || undefined
  }

  // @ts-ignore - dynamic i18n key
  return i18n.te(`chartLabels.${metricName}`) ? i18n.t(`chartLabels.${metricName}`) : metricName
})

const metricAxesTitle = computed<string | undefined>(() => {
  if (props.chartOptions?.metricAxesTitle) {
    return props.chartOptions?.metricAxesTitle
  }

  const { metricNames, metricUnits } = chartMeta.value

  if (!metricNames || !metricUnits) {
    return undefined
  }

  const metricName = metricNames[0]
  const metricUnit = metricUnits[metricName] || ''

  if (metricNames.length > 1) {
    if (metricName.includes('latency')) {
      // @ts-ignore - dynamic i18n key
      return i18n.t('metricAxisTitles.latency_in', { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) })
    }
    if (metricName.includes('size')) {
      // @ts-ignore - dynamic i18n key
      return i18n.t('metricAxisTitles.size_in', { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) })
    }
  }

  // @ts-ignore - dynamic i18n key
  if (i18n.te(`metricAxisTitles.${metricName}`) && (isNoSuffixMetric(metricUnit) || i18n.te(`chartUnits.${metricUnit}`))) {
    if (isNoSuffixMetric(metricUnit)) {
      // @ts-ignore - dynamic i18n key
      return i18n.t(`metricAxisTitles.${metricName}`) || undefined
    }
    // @ts-ignore - dynamic i18n key
    return i18n.t(`metricAxisTitles.${metricName}`, { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) }) || undefined
  }

  return metricName || undefined
})

const dimensionAxesTitle = computed<string | undefined>(() => {
  if (props.chartOptions?.dimensionAxesTitle) {
    return props.chartOptions.dimensionAxesTitle
  }

  const meta = exploreData.value?.meta
  const dimension = isTimeSeriesChart.value ? 'Time' : Object.keys(meta?.display || meta?.metric_names || {})[0]

  if (!dimension) {
    return undefined
  }

  // @ts-ignore - dynamic i18n key
  return i18n.te(`chartLabels.${dimension}`) ? i18n.t(`chartLabels.${dimension}`) : dimension
})

const axisTitleGranularity = computed<GranularityValues | null>(() => (
  isScatterChart.value ? scatterGranularity.value : msToGranularity(Number(exploreData.value?.meta?.granularity_ms))
))

const timestampAxisTitle = computed(() => {
  if (isPlatformDatasource(chartMeta.value.datasource)) {
    return i18n.t('timestampAxisTitles.platform')
  }

  const granularity = axisTitleGranularity.value

  if (!granularity) {
    return undefined
  }

  // @ts-ignore - dynamic i18n key
  return i18n.te(`granularityAxisTitles.${granularity}`) ? i18n.t(`granularityAxisTitles.${granularity}`) : granularity
})

const emptyStateTitle = computed(() => props.emptyStateTitle || i18n.t('noDataAvailableTitle'))
const emptyStateDescription = computed(() => props.emptyStateDescription || i18n.t('noDataAvailableDescription'))
const hasValidChartData = computed<boolean>(() => {
  if (isScatterChart.value) {
    return !!scatterData.value?.points.length
  }

  if (isTimeSeriesChart.value) {
    return hasMillisecondTimestamps(computedChartData.value)
  }

  return !!(exploreData.value && exploreData.value.meta && exploreData.value.data.length)
})

const timeSeriesGranularity = computed<GranularityValues>(() => {
  const data = exploreData.value

  if (!data) {
    return 'hourly'
  }

  if (!data.meta.granularity_ms) {
    return msToGranularity(
      new Date(data.data[1].timestamp).getTime() - new Date(data.data[0].timestamp).getTime(),
    ) || 'hourly'
  }

  return msToGranularity(data.meta.granularity_ms) || 'hourly'
})

// This is to determine the how granular the scatter's x-axis should be. Maybe this could be configurable?
const SCATTER_TICK_COUNT = 7

const scatterGranularity = computed<GranularityValues>(() => {
  return msToGranularity(Math.floor((timeRangeMs.value || 0) / SCATTER_TICK_COUNT)) || 'hourly'
})

const chartLegendSortFn = computed(() => {
  if (props.chartOptions.chartLegendSortFn) {
    return props.chartOptions.chartLegendSortFn
  }

  return (a: EnhancedLegendItem, b: EnhancedLegendItem) => {
    if (a.text === i18n.t('chartLabels.____OTHER____')) {
      return 1
    }

    if (b.text === i18n.t('chartLabels.____OTHER____')) {
      return -1
    }

    // Status codes (if label is numeric)
    if (!isNaN(parseInt(a.text, 10)) && !isNaN(parseInt(b.text, 10))) {
      return a.text < b.text ? -1 : 1
    }

    // Fallback sort on value (number of Requests)
    return a.value && b.value ? b.value.raw - a.value.raw : 0
  }
})

const chartTooltipSortFn = computed(() => {
  if (props.chartOptions.chartTooltipSortFn) {
    return props.chartOptions.chartTooltipSortFn
  }

  return (a: TooltipEntry, b: TooltipEntry) => {
    if (a.label === i18n.t('chartLabels.____OTHER____')) {
      return 1
    }

    if (b.label === i18n.t('chartLabels.____OTHER____')) {
      return -1
    }

    // Status codes (if label is numeric)
    if (!isNaN(parseInt(a.label, 10)) && !isNaN(parseInt(b.label, 10))) {
      return a.label < b.label ? -1 : 1
    }

    // Fallback sort on value (number of Requests)
    return a.value && b.value ? b.rawValue - a.rawValue : 0
  }
})

const zoomActionItems = computed<ZoomActionItem[]>(() => {
  return [
    ...(props.timeseriesZoom ? [{
      label: i18n.t('zoom_action_items.zoom'),
      key: 'zoom-in',
      action: (newTimeRange: AbsoluteTimeRangeV4) => emit('zoom-time-range', newTimeRange),
    }] : []),
    ...(props.exploreLink ? [{
      label: i18n.t('zoom_action_items.explore'),
      key: 'explore',
      href: props.exploreLink.href,
    }] : []),
    ...(props.requestsLink ? [{
      label: i18n.t('zoom_action_items.view_requests'),
      key: 'view-requests',
      href: props.requestsLink.href,
    }] : []),
  ]
})

provide('showLegendValues', showLegendValues)
provide('legendPosition', toRef(props, 'legendPosition'))

</script>

<style lang="scss" scoped>
@use "../styles/globals" as *;
@use "../styles/chart-shell";

.analytics-chart-shell {
  height: 100%;
  position: relative;
  width: 100%;

  .analytics-chart-parent {
    height: inherit;
    width: inherit;
  }

  .chart-empty-state {
    padding: var(--kui-space-70, $kui-space-70)
      var(--kui-space-0, $kui-space-0)
      var(--kui-space-60, $kui-space-60)
      var(--kui-space-0, $kui-space-0);
  }

  .chart-truncation-warning {
    align-items: center;
    background-color: var(--kui-color-background, $kui-color-background);
    display: flex;
    justify-content: flex-start;
    left: 0;
    position: absolute;
    top: 0;
    transform: translateX(-4px); // to align with title offset
    z-index: 999;
  }
}
</style>

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
          :size="KUI_ICON_SIZE_40"
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
        :threshold="chartOptions.threshold"
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
        :metric-unit="computedMetricUnit"
        :synthetics-data-key="syntheticsDataKey"
        :tooltip-dimension-display="dimensionAxesTitle"
        :tooltip-metric-display="tooltipMetricDisplay"
        :tooltip-title="tooltipTitle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'
import type { AnalyticsChartOptions, EnhancedLegendItem, ExternalLink, TooltipEntry, ZoomActionItem } from '../types'
import { ChartLegendPosition } from '../enums'
import StackedBarChart from './chart-types/StackedBarChart.vue'
import DonutChart from './chart-types/DonutChart.vue'
import { computed, provide, toRef } from 'vue'
import { msToGranularity } from '@kong-ui-public/analytics-utilities'
import type { AbsoluteTimeRangeV4, ExploreAggregations, ExploreResultV4, GranularityValues } from '@kong-ui-public/analytics-utilities'
import { hasMillisecondTimestamps, defaultStatusCodeColors } from '../utils'
import TimeSeriesChart from './chart-types/TimeSeriesChart.vue'
import { KUI_COLOR_TEXT_WARNING, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { WarningIcon } from '@kong/icons'

interface ChartProps {
  chartData: ExploreResultV4
  chartOptions: AnalyticsChartOptions
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

const computedChartData = computed(() => {
  return isTimeSeriesChart.value
    ? composables.useExploreResultToTimeDataset(
      {
        fill: props.chartOptions.stacked,
        colorPalette: props.chartOptions.chartDatasetColors || defaultStatusCodeColors,
      },
      toRef(props, 'chartData'),
    ).value
    : composables.useExploreResultToDatasets(
      {
        fill: props.chartOptions.stacked,
        colorPalette: props.chartOptions.chartDatasetColors || defaultStatusCodeColors,
      },
      toRef(props, 'chartData'),
    ).value
})

const canBrush = computed(() => {
  return props.timeseriesZoom || !!props.exploreLink || !!props.requestsLink
})

const timeRangeMs = computed<number | undefined>(() => {
  if (!props.chartData?.meta) {
    return 0
  }

  return ('start_ms' in props.chartData.meta)
    ? props.chartData.meta.end_ms - props.chartData.meta.start_ms
    : undefined
})

const computedMetricUnit = computed<string>(() => {
  if (!props.chartData.meta?.metric_units) {
    return ''
  }

  return Object.values(props.chartData.meta.metric_units)[0]
})

const showLegendValues = computed(() => props.showLegendValues && props.legendPosition !== ChartLegendPosition.Hidden)

const { legendValues } = composables.useChartLegendValues(computedChartData, props.chartOptions.type, computedMetricUnit)

const maxEntitiesShown = computed(() => props.chartData?.meta?.limit?.toString() || null)
const resultSetTruncated = computed(() => {
  return props.chartOptions.hideTruncationWarning
    ? false
    : props.chartData?.meta?.truncated || false
})
const notAllDataShownTooltipContent = i18n.t('limitedResultsShown', { maxReturned: maxEntitiesShown.value })
const isBarChart = computed<boolean>(() => [
  'vertical_bar',
  'horizontal_bar',
].includes(props.chartOptions.type))
const isTimeSeriesChart = computed<boolean>(() => {
  return ['timeseries_bar', 'timeseries_line'].some(e => e === props.chartOptions.type)
})
const isDonutChart = computed<boolean>(() => props.chartOptions.type === 'donut')

const barChartOrientation = computed<'horizontal' | 'vertical'>(() => props.chartOptions.type.includes('vertical') ? 'vertical' : 'horizontal')

const tooltipMetricDisplay = computed<string | undefined>(() => {
  if (!props.chartData?.meta.metric_names || !props.chartData?.meta.metric_units) {
    return undefined
  }

  const metricName = props.chartData.meta.metric_names[0]
  const metricUnit = props.chartData.meta.metric_units[metricName as ExploreAggregations]

  if (props.chartData.meta.metric_names.length > 1) {
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
  return i18n.te(`chartLabels.${metricName}`) ? i18n.t(`chartLabels.${metricName}`) : metricName
})

const metricAxesTitle = computed<string | undefined>(() => {
  if (props.chartOptions?.metricAxesTitle) {
    return props.chartOptions?.metricAxesTitle
  }

  if (!props.chartData?.meta.metric_names || !props.chartData?.meta.metric_units) {
    return undefined
  }

  const metricName = props.chartData.meta.metric_names[0]
  const metricUnit = props.chartData.meta.metric_units[metricName as ExploreAggregations]

  if (props.chartData.meta.metric_names.length > 1) {
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
  if (i18n.te(`metricAxisTitles.${metricName}`) && i18n.te(`chartUnits.${metricUnit}`)) {
    // @ts-ignore - dynamic i18n key
    return i18n.t(`metricAxisTitles.${metricName}`, { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) }) || undefined
  }

  return metricName || undefined
})

const dimensionAxesTitle = computed<string | undefined>(() => {
  if (props.chartOptions?.dimensionAxesTitle) {
    return props.chartOptions.dimensionAxesTitle
  }

  const dimension = isTimeSeriesChart.value ? 'Time' : Object.keys(props.chartData.meta.display || props.chartData.meta.metric_names as Record<string, any>)[0]

  if (!dimension) {
    return undefined
  }

  // @ts-ignore - dynamic i18n key
  return i18n.te(`chartLabels.${dimension}`) ? i18n.t(`chartLabels.${dimension}`) : dimension
})

const timestampAxisTitle = computed(() => {
  const granularity = msToGranularity(Number(props.chartData.meta.granularity_ms))

  if (!granularity) {
    return undefined
  }

  // @ts-ignore - dynamic i18n key
  return i18n.te(`granularityAxisTitles.${granularity}`) ? i18n.t(`granularityAxisTitles.${granularity}`) : granularity
})

const emptyStateTitle = computed(() => props.emptyStateTitle || i18n.t('noDataAvailableTitle'))
const emptyStateDescription = computed(() => props.emptyStateDescription || i18n.t('noDataAvailableDescription'))
const hasValidChartData = computed(() => {
  if (isTimeSeriesChart.value) {
    return hasMillisecondTimestamps(computedChartData.value)
  }

  return props.chartData && props.chartData.meta && props.chartData.data.length
})

const timeSeriesGranularity = computed<GranularityValues>(() => {

  if (!props.chartData.meta.granularity_ms) {
    return msToGranularity(
      new Date(props.chartData.data[1].timestamp).getTime() - new Date(props.chartData.data[0].timestamp).getTime(),
    ) || 'hourly'
  }

  return msToGranularity(props.chartData.meta.granularity_ms) || 'hourly'
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
    background-color: white;
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

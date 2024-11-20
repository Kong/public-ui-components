<template>
  <div
    class="analytics-chart-shell"
  >
    <div
      v-if="hasValidChartData && resultSetTruncated && maxEntitiesShown || (!hasKebabMenuAccess &&allowCsvExport) || props.chartTitle"
      class="chart-header"
    >
      <div
        class="chart-title"
        :title="chartTitle"
      >
        {{ chartTitle }}
      </div>
      <div
        v-if="resultSetTruncated && maxEntitiesShown"
        class="chart-header-icons-wrapper"
      >
        <KTooltip
          class="tooltip"
          max-width="500"
          placement="right"
        >
          <WarningIcon
            :color="`var(--kui-color-text-warning, ${KUI_COLOR_TEXT_WARNING})`"
            decorative
            :size="KUI_ICON_SIZE_40"
          />
          <template #content>
            {{ notAllDataShownTooltipContent }}
          </template>
        </KTooltip>
      </div>
      <div
        v-if="allowCsvExport && hasValidChartData"
        class="chart-export-button"
      >
        <CsvExportButton
          :data="rawChartData"
          :filename-prefix="filenamePrefix"
        />
      </div>
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
        :time-range-ms="timeRangeMs"
        :tooltip-title="tooltipTitle"
        :type="(chartOptions.type as ('timeseries_line' | 'timeseries_bar'))"
        :zoom="timeseriesZoom"
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
        :tooltip-title="tooltipTitle"
      />
      <DoughnutChart
        v-else-if="isDoughnutChart"
        :chart-data="computedChartData"
        :dataset-colors="chartOptions.chartDatasetColors || defaultStatusCodeColors"
        :legend-position="legendPosition"
        :legend-values="legendValues"
        :metric-unit="computedMetricUnit"
        :synthetics-data-key="syntheticsDataKey"
        :tooltip-title="tooltipTitle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'
import type { AnalyticsChartOptions, EnhancedLegendItem, TooltipEntry } from '../types'
import { ChartLegendPosition } from '../enums'
import StackedBarChart from './chart-types/StackedBarChart.vue'
import DoughnutChart from './chart-types/DoughnutChart.vue'
import type { PropType } from 'vue'
import { computed, provide, toRef } from 'vue'
import { msToGranularity } from '@kong-ui-public/analytics-utilities'
import type { AbsoluteTimeRangeV4, ExploreAggregations, ExploreResultV4, GranularityValues } from '@kong-ui-public/analytics-utilities'
import { hasMillisecondTimestamps, defaultStatusCodeColors } from '../utils'
import TimeSeriesChart from './chart-types/TimeSeriesChart.vue'
import { KUI_COLOR_TEXT_WARNING, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { WarningIcon } from '@kong/icons'
import CsvExportButton from './CsvExportButton.vue'

const props = defineProps({
  allowCsvExport: {
    type: Boolean,
    required: false,
    default: false,
  },
  goToExplore: {
    type: String,
    required: false,
    default: '',
  },
  chartData: {
    type: Object as PropType<ExploreResultV4>,
    required: true,
  },
  chartOptions: {
    type: Object as PropType<AnalyticsChartOptions>,
    required: true,
  },
  tooltipTitle: {
    type: String,
    required: false,
    default: '',
  },
  emptyStateTitle: {
    type: String,
    required: false,
    default: '',
  },
  emptyStateDescription: {
    type: String,
    required: false,
    default: '',
  },
  chartTitle: {
    type: String,
    required: false,
    default: '',
  },
  filenamePrefix: {
    type: String,
    required: false,
    default: '',
  },
  legendPosition: {
    type: String as PropType<`${ChartLegendPosition}`>,
    required: false,
    default: ChartLegendPosition.Right,
  },
  syntheticsDataKey: {
    type: String,
    required: false,
    default: '',
  },
  showLegendValues: {
    type: Boolean,
    required: false,
    default: true,
  },
  showAnnotations: {
    type: Boolean,
    required: false,
    default: true,
  },
  timeseriesZoom: {
    type: Boolean,
    required: false,
    default: false,
  },
  showMenu: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void,
}>()

const { i18n } = composables.useI18n()
const { evaluateFeatureFlag } = composables.useEvaluateFeatureFlag()

const hasKebabMenuAccess = evaluateFeatureFlag('ma-3043-analytics-chart-kebab-menu', false)

const rawChartData = toRef(props, 'chartData')

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

const showLegendValues = computed(() => props.showLegendValues && props.legendPosition !== ChartLegendPosition.Bottom)

const { legendValues } = composables.useChartLegendValues(computedChartData, props.chartOptions.type, computedMetricUnit)

const maxEntitiesShown = computed(() => props.chartData?.meta?.limit?.toString() || null)
const resultSetTruncated = computed(() => props.chartData?.meta?.truncated || false)
const notAllDataShownTooltipContent = i18n.t('limitedResultsShown', { maxReturned: maxEntitiesShown.value })
const isBarChart = computed<boolean>(() => [
  'vertical_bar',
  'horizontal_bar',
].includes(props.chartOptions.type))
const isTimeSeriesChart = computed<boolean>(() => {
  return ['timeseries_bar', 'timeseries_line'].some(e => e === props.chartOptions.type)
})
const isDoughnutChart = computed<boolean>(() => props.chartOptions.type === 'doughnut')

const barChartOrientation = computed<'horizontal' | 'vertical'>(() => props.chartOptions.type.includes('vertical') ? 'vertical' : 'horizontal')

const metricAxesTitle = computed<string | undefined>(() => {
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
  return props.chartOptions?.metricAxesTitle || (i18n.te(`metricAxisTitles.${metricName}`) && i18n.te(`chartUnits.${metricUnit}`) &&
    // @ts-ignore - dynamic i18n key
    // Metric units are always pluralized on the axis.
    i18n.t(`metricAxisTitles.${metricName}`, { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) })) || undefined
})

const dimensionAxesTitle = computed<string | undefined>(() => {
  const dimension = isTimeSeriesChart.value ? 'Time' : Object.keys(props.chartData.meta.display || props.chartData.meta.metric_names as Record<string, any>)[0]
  // @ts-ignore - dynamic i18n key
  return props.chartOptions.dimensionAxesTitle || (i18n.te(`chartLabels.${dimension}`) &&
    // @ts-ignore - dynamic i18n key
    i18n.t(`chartLabels.${dimension}`)) || undefined
})

const timestampAxisTitle = computed(() => {
  const granularity = msToGranularity(Number(props.chartData.meta.granularity_ms))

  // @ts-ignore - dynamic i18n key
  return i18n.t(`granularityAxisTitles.${granularity}`)
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

  &.is-hovering {
    .chart-header :deep(.popover-trigger-wrapper) {
      opacity: 1;
      visibility: visible;
    }
  }

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
  .chart-header {
    align-items: center;
    display: flex;
    justify-content: flex-start;
    right: 0;
    width: 100%;
    z-index: 999;

    &:hover :deep(.popover-trigger-wrapper) {
      opacity: 1;
      visibility: visible;
    }

    .chart-header-icons-wrapper {
      display: flex;
      justify-content: end;
    }

    .chart-export-button {
      display: flex;
      margin-left: var(--kui-space-auto, $kui-space-auto);
      margin-right: var(--kui-space-0, $kui-space-0);
    }
  }

  .chart-title {
    cursor: default;
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    max-width: 32ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tooltip {
    display: flex;
    margin-left: var(--kui-space-50, $kui-space-50);
    margin-top: var(--kui-space-10, $kui-space-10);
  }
}
</style>

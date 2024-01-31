<template>
  <div
    class="analytics-chart-shell"
  >
    <div class="chart-header">
      <div
        v-if="chartTitle"
        class="chart-title"
      >
        {{ chartTitle }}
      </div>
      <div class="chart-header-icons-wrapper">
        <KTooltip
          v-if="hasValidChartData && resultSetTruncated && maxEntitiesShown"
          class="tooltip"
          max-width="500"
          placement="right"
        >
          <WarningIcon
            :color="KUI_COLOR_TEXT_WARNING"
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
          :data="(rawChartData as AnalyticsExploreV2Result)"
          :filename-prefix="filenamePrefix"
        />
      </div>
    </div>
    <KEmptyState
      v-if="!hasValidChartData"
      class="chart-empty-state"
      :cta-is-hidden="true"
      data-testid="no-data-in-report"
      icon="stateNoData"
      icon-size="170"
    >
      <template #title>
        {{ emptyStateTitle }}
      </template>
      <template #message>
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
        :chart-legend-sort-fn="chartOptions.chartLegendSortFn"
        :chart-tooltip-sort-fn="chartOptions.chartTooltipSortFn"
        :dataset-colors="chartOptions.chartDatasetColors"
        :dimension-axes-title="timestampAxisTitle"
        :fill="chartOptions.fill"
        :granularity="timeSeriesGranularity"
        :legend-values="legendValues"
        :metric-axes-title="metricAxesTitle"
        :metric-unit="computedMetricUnit"
        :stacked="chartOptions.stacked"
        :synthetics-data-key="syntheticsDataKey"
        :time-range-ms="timeRangeMs"
        :time-range-sec="timeRangeSec"
        :tooltip-title="tooltipTitle"
        :type="(chartOptions.type as (ChartTypes.TIMESERIES_LINE | ChartTypes.TIMESERIES_BAR))"
      />
      <StackedBarChart
        v-else-if="isBarChart"
        :annotations="showAnnotations"
        :chart-data="computedChartData"
        :chart-legend-sort-fn="chartOptions.chartLegendSortFn"
        :chart-tooltip-sort-fn="chartOptions.chartTooltipSortFn"
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
        :dataset-colors="chartOptions.chartDatasetColors"
        :fill="chartOptions.fill"
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
import type { AnalyticsChartOptions } from '../types'
import { ChartTypes, ChartLegendPosition } from '../enums'
import StackedBarChart from './chart-types/StackedBarChart.vue'
import DoughnutChart from './chart-types/DoughnutChart.vue'
import type { PropType } from 'vue'
import { computed, provide, toRef } from 'vue'
import { GranularityKeys, msToGranularity } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsExploreResult, AnalyticsExploreV2Result, GranularityFullObj } from '@kong-ui-public/analytics-utilities'
import { datavisPalette, hasMillisecondTimestamps } from '../utils'
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
  chartData: {
    type: Object as PropType<AnalyticsExploreResult | AnalyticsExploreV2Result>,
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
})

const { i18n } = composables.useI18n()

const rawChartData = toRef(props, 'chartData')

const computedChartData = computed(() => {
  return isTimeSeriesChart.value
    ? composables.useExploreResultToTimeDataset(
      {
        fill: props.chartOptions.fill,
        colorPalette: props.chartOptions.chartDatasetColors || datavisPalette,
      },
      toRef(props, 'chartData'),
    ).value
    : composables.useExploreResultToDatasets(
      {
        fill: props.chartOptions.fill,
        colorPalette: props.chartOptions.chartDatasetColors || datavisPalette,
      },
      toRef(props, 'chartData'),
    ).value
})

const timeRangeSec = computed<number | undefined>(() => {
  if (!props.chartData?.meta) { return 0 }

  return ('start' in props.chartData.meta)
    ? props.chartData.meta.end - props.chartData.meta.start
    : undefined
})

const timeRangeMs = computed<number | undefined>(() => {
  if (!props.chartData?.meta) { return 0 }

  return ('startMs' in props.chartData.meta)
    ? props.chartData.meta.endMs - props.chartData.meta.startMs
    : undefined
})

const computedMetricUnit = computed<string>(() => {
  if (!props.chartData.meta?.metricUnits) {
    return ''
  }

  return Object.values(props.chartData.meta.metricUnits)[0]
})

const showLegendValues = computed(() => props.showLegendValues && props.legendPosition !== ChartLegendPosition.Bottom)

const { legendValues } = composables.useChartLegendValues(computedChartData, props.chartOptions.type, computedMetricUnit)

const maxEntitiesShown = computed(() => props.chartData?.meta?.limit?.toString() || null)
const resultSetTruncated = computed(() => props.chartData?.meta?.truncated || false)
const notAllDataShownTooltipContent = i18n.t('limitedResultsShown', { maxReturned: maxEntitiesShown.value })
const isBarChart = computed<boolean>(() => [
  ChartTypes.VERTICAL_BAR.toString(),
  ChartTypes.HORIZONTAL_BAR.toString(),
].includes(props.chartOptions.type))
const isTimeSeriesChart = computed<boolean>(() => {
  return [ChartTypes.TIMESERIES_BAR, ChartTypes.TIMESERIES_LINE].some(e => e === props.chartOptions.type)
})
const isDoughnutChart = computed<boolean>(() => props.chartOptions.type === ChartTypes.DOUGHNUT)

const barChartOrientation = computed<'horizontal' | 'vertical'>(() => props.chartOptions.type.includes('Vertical') ? 'vertical' : 'horizontal')

const metricAxesTitle = computed<string | undefined>(() => {
  if (!props.chartData?.meta.metricNames || !props.chartData?.meta.metricUnits) {
    return undefined
  }

  const metricName = props.chartData.meta.metricNames[0]
  const metricUnit = props.chartData.meta.metricUnits[metricName]
  // @ts-ignore - dynamic i18n key
  return props.chartOptions?.metricAxesTitle || (i18n.te(`metricAxisTitles.${metricName}`) && i18n.te(`chartUnits.${metricUnit}`) &&
    // @ts-ignore - dynamic i18n key
    // Metric units are always pluralized on the axis.
    i18n.t(`metricAxisTitles.${metricName}`, { unit: i18n.t(`chartUnits.${metricUnit}`, { plural: 's' }) })) || undefined
})

const dimensionAxesTitle = computed<string | undefined>(() => {
  const dimension = isTimeSeriesChart.value ? 'Time' : Object.keys(props.chartData.meta.dimensions || props.chartData.meta.metricNames as Object)[0]
  // @ts-ignore - dynamic i18n key
  return props.chartOptions.dimensionAxesTitle || (i18n.te(`chartLabels.${dimension}`) &&
    // @ts-ignore - dynamic i18n key
    i18n.t(`chartLabels.${dimension}`)) || undefined
})

const timestampAxisTitle = computed(() => {
  if (props.chartData.meta.granularity && typeof props.chartData.meta.granularity !== 'number' && 'duration' in (props.chartData.meta.granularity as GranularityFullObj)) {
    const granularity = msToGranularity((props.chartData.meta.granularity as GranularityFullObj).duration)

    // @ts-ignore - dynamic i18n key
    return i18n.t(`granularityAxisTitles.${granularity}`)
  } else if (props.chartData.meta.granularity && !isNaN(Number(props.chartData.meta.granularity))) {
    const granularity = msToGranularity(Number(props.chartData.meta.granularity))

    // @ts-ignore - dynamic i18n key
    return i18n.t(`granularityAxisTitles.${granularity}`)
  }

  // @ts-ignore - dynamic i18n key
  return i18n.t('chartlabels.Time')
})

const emptyStateTitle = computed(() => props.emptyStateTitle || i18n.t('noDataAvailableTitle'))
const emptyStateDescription = computed(() => props.emptyStateDescription || i18n.t('noDataAvailableDescription'))
const hasValidChartData = computed(() => {
  if (isTimeSeriesChart.value) {
    return hasMillisecondTimestamps(computedChartData.value)
  }

  return props.chartData && props.chartData.meta && props.chartData.records.length
})

const timeSeriesGranularity = computed<GranularityKeys>(() => {

  if (!props.chartData.meta.granularity) {
    return msToGranularity(
      new Date(props.chartData.records[1].timestamp).getTime() - new Date(props.chartData.records[0].timestamp).getTime(),
    ) || GranularityKeys.HOURLY
  }

  if (typeof props.chartData.meta.granularity === 'number') {
    return msToGranularity(props.chartData.meta.granularity) || GranularityKeys.HOURLY
  }

  return msToGranularity(props.chartData.meta.granularity.duration) || GranularityKeys.HOURLY
})

provide('showLegendValues', showLegendValues)
provide('legendPosition', toRef(props, 'legendPosition'))

</script>

<style lang="scss" scoped>
@import '../styles/base';
@import '../styles/chart-shell';

.analytics-chart-shell {
  height: 100%;
  width: 100%;
  .analytics-chart-parent {
    height: inherit;
    width: inherit;
  }

  .chart-empty-state {
    padding: $kui-space-70 $kui-space-0 $kui-space-60 $kui-space-0;
  }
  .chart-header {
    align-items: center;
    display: flex;
    justify-content: flex-start;
    padding-bottom: $kui-space-60;

    .chart-header-icons-wrapper {
      display: flex;
      justify-content: end;
    }

    .chart-export-button {
      display: flex;
      margin-left: auto;
      margin-right: 0;
    }
  }

  .chart-title {
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-semibold;
  }

  .tooltip {
    display: flex;
    margin-left: $kui-space-50;
    margin-top: $kui-space-10;
  }
}

</style>

<template>
  <div class="analytics-chart-shell">
    <div class="chart-header">
      <div
        v-if="chartTitle"
        class="chart-title"
      >
        {{ chartTitle }}
      </div>
      <div id="result-truncated">
        <KTooltip
          v-if="hasValidChartData && resultSetTruncated && maxEntitiesShown"
          class="tooltip"
          max-width="500"
          placement="right"
        >
          <div class="limit-icon-wrapper">
            <WarningIcon
              :color="KUI_COLOR_TEXT_WARNING"
              decorative
              :size="KUI_ICON_SIZE_40"
            />
          </div>
          <template #content>
            {{ notAllDataShownTooltipContent }}
          </template>
        </KTooltip>
      </div>
      <div class="chart-wrapper-export-button">
        <KButton
          appearance="secondary"
          class="chart-wrapper-export-button-display"
          data-testid="csv-export-button"
          @click.prevent="exportCsv"
        >
          {{ i18n.t('csvExport.exportButton') }}
        </KButton>
      </div>
      <CsvExportModal
        v-if="exportModalVisible"
        :chart-data="chartData"
        :is-visible="true"
        :modal-title="chartTitle"
        :selected-range="selectedRange"
        @toggle-modal="setModalVisibility"
      />
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
      :style="{ height: heightRef, width }"
    >
      <TimeSeriesChart
        v-if="isTimeSeriesChart"
        :chart-data="computedChartData"
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
        data-testid="bar-chart-container"
        :dimension-axes-title="dimensionAxesTitle"
        :legend-values="legendValues"
        :metric-axes-title="metricAxesTitle"
        :metric-unit="computedMetricUnit"
        :orientation="barChartOrientation"
        :stacked="chartOptions.stacked"
        :synthetics-data-key="syntheticsDataKey"
        :tooltip-title="tooltipTitle"
        @height-update="handleHeightUpdate"
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
import CsvExportModal from './CsvExportModal.vue'
import type { PropType } from 'vue'
import { computed, provide, ref, toRef } from 'vue'
import { GranularityKeys, msToGranularity } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsExploreResult, AnalyticsExploreV2Result, GranularityFullObj } from '@kong-ui-public/analytics-utilities'
import { datavisPalette, formatTime, hasMillisecondTimestamps } from '../utils'
import TimeSeriesChart from './chart-types/TimeSeriesChart.vue'
import { KUI_COLOR_TEXT_WARNING, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { WarningIcon } from '@kong/icons'

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
    required: true,
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
    required: true,
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
  height: {
    type: String,
    required: false,
    default: '500px',
    validator: (value: string): boolean => {
      return /(\d *)(px|%)/.test(value)
    },
  },
  width: {
    type: String,
    required: false,
    default: '100%',
    validator: (value: string): boolean => {
      return /(\d *)(px|%)/.test(value)
    },
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
const heightRef = ref<string>(props.height)

const handleHeightUpdate = (height: number) => {
  heightRef.value = `${height}px`
}

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
    i18n.t(`metricAxisTitles.${metricName}`, { unit: i18n.t(`chartUnits.${metricUnit}`) })) || undefined
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

// CSV Export Modal
const exportModalVisible = ref(false)
const selectedRange = computed(() => {
  return ('start' in props.chartData.meta)
    ? `${formatTime(props.chartData.meta.start)} - ${formatTime(props.chartData.meta.end, { includeTZ: true })}`
    : ''
})
const setModalVisibility = (val: boolean) => {
  exportModalVisible.value = val
}
const exportCsv = () => {
  setModalVisibility(true)
}

provide('showLegendValues', showLegendValues)
provide('legendPosition', toRef(props, 'legendPosition'))

</script>

<style lang="scss" scoped>
@import '../styles/base';
@import '../styles/chart-shell';

.analytics-chart-shell {
  padding: $kui-space-60;

  .chart-empty-state {
    padding: $kui-space-70 $kui-space-0 $kui-space-60 $kui-space-0;
  }
  .chart-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding-bottom: $kui-space-60;
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

  .limit-icon-wrapper {
    display: flex;
    flex-direction: row;
  }

}

</style>

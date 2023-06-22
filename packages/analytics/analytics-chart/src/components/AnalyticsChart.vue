<template>
  <div v-if="!hasValidChartData">
    <KEmptyState
      :cta-is-hidden="true"
      data-testid="no-data-in-report"
      icon="stateNoData"
      icon-size="170"
    >
      <template #title>
        {{ emptyMessage.title }}
      </template>
      <template #message>
        <span>{{ emptyMessage.description }}</span>
      </template>
    </KEmptyState>
  </div>
  <div
    v-else
    class="analytics-chart-parent chart-border"
  >
    <TimeSeriesChart
      v-if="isTimeSeriesChart"
      :chart-data="computedChartData"
      :chart-title="chartTitle"
      :dataset-colors="chartOptions.chartDatasetColors"
      :dimension-axes-title="timestampAxisTitle"
      :fill="chartOptions.fill"
      :granularity="timeSeriesGranularity"
      :height="height"
      :legend-values="legendValues"
      :metric-axes-title="metricAxesTitle"
      :metric-unit="computedMetricUnit"
      :stacked="chartOptions.stacked"
      :synthetics-data-key="syntheticsDataKey"
      :time-range="timeRange"
      :tooltip-title="tooltipTitle"
      :type="(chartOptions.type as (ChartTypes.TIMESERIES_LINE | ChartTypes.TIMESERIES_BAR))"
      :width="width"
    >
      <template #header-message>
        <KTooltip
          v-if="resultSetTruncated && maxEntitiesShown"
          class="tooltip"
          max-width="500"
          placement="bottom"
        >
          <div class="limit-icon-wrapper">
            <KIcon
              class="warning-icon"
              color="var(--white, #ffffff)"
              hide-title
              icon="warning"
              secondary-color="var(--yellow-400, #fabe5f)"
              size="18"
            />
          </div>
          <template #content>
            {{ notAllDataShownTooltipContent }}
          </template>
        </KTooltip>
      </template>
    </TimeSeriesChart>
    <StackedBarChart
      v-else-if="isBarChart"
      :annotations="showAnnotations"
      :chart-data="computedChartData"
      :chart-title="chartTitle"
      data-testid="bar-chart-container"
      :dimension-axes-title="dimensionAxesTitle"
      :legend-values="legendValues"
      :metric-axes-title="metricAxesTitle"
      :metric-unit="computedMetricUnit"
      :orientation="barChartOrientation"
      :synthetics-data-key="syntheticsDataKey"
      :tooltip-title="tooltipTitle"
    >
      <template #header-message>
        <KTooltip
          v-if="resultSetTruncated && maxEntitiesShown"
          class="tooltip"
          max-width="500"
          placement="bottom"
        >
          <div class="limit-icon-wrapper">
            <KIcon
              class="warning-icon"
              color="var(--white, #ffffff)"
              hide-title
              icon="warning"
              secondary-color="var(--yellow-400, #fabe5f)"
              size="18"
            />
          </div>
          <template #content>
            {{ notAllDataShownTooltipContent }}
          </template>
        </KTooltip>
      </template>
    </StackedBarChart>
    <DoughnutChart
      v-else-if="isDoughnutChart"
      :chart-data="computedChartData"
      :chart-title="chartTitle"
      :dataset-colors="chartOptions.chartDatasetColors"
      :fill="chartOptions.fill"
      :legend-position="legendPosition"
      :legend-values="legendValues"
      :metric-unit="computedMetricUnit"
      :synthetics-data-key="syntheticsDataKey"
      :time-range="timeRange"
      :tooltip-title="tooltipTitle"
      :width="width"
    >
      <template #header-message>
        <KTooltip
          v-if="resultSetTruncated && maxEntitiesShown"
          class="tooltip"
          max-width="500"
          placement="bottom"
        >
          <div class="limit-icon-wrapper">
            <KIcon
              class="warning-icon"
              color="var(--white, #fff)"
              hide-title
              icon="warning"
              secondary-color="var(--yellow-400, #fabe5f)"
              size="18"
            />
          </div>
          <template #content>
            {{ notAllDataShownTooltipContent }}
          </template>
        </KTooltip>
      </template>
    </DoughnutChart>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'
import { AnalyticsChartOptions } from '../types'
import { ChartTypes, ChartLegendPosition } from '../enums'
import StackedBarChart from './chart-types/StackedBarChart.vue'
import DoughnutChart from './chart-types/DoughnutChart.vue'
import { computed, PropType, provide, toRef } from 'vue'
import { AnalyticsExploreResult, AnalyticsExploreV2Result, GranularityFullObj, GranularityKeys, msToGranularity } from '@kong-ui-public/analytics-utilities'
import { datavisPalette } from '../utils'
import TimeSeriesChart from './chart-types/TimeSeriesChart.vue'

const props = defineProps({
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
    default: '400px',
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

const chartDataRef = toRef(props, 'chartData')
const chartOptionsRef = toRef(props, 'chartOptions')
const legendPositionRef = toRef(props, 'legendPosition')

const computedChartData = computed(() => {
  return isTimeSeriesChart.value
    ? composables.useExploreResultToTimeDataset(
      {
        fill: props.chartOptions.fill,
        colorPalette: props.chartOptions.chartDatasetColors || datavisPalette,
      },
      chartDataRef,
    ).value
    : composables.useExploreResultToDatasets(
      {
        fill: props.chartOptions.fill,
        colorPalette: props.chartOptions.chartDatasetColors || datavisPalette,
      },
      chartDataRef,
    ).value
})

const timeRange = computed<number>(() => {
  if (!chartDataRef?.value?.meta) { return 0 }

  return ('startMs' in chartDataRef.value.meta)
    ? chartDataRef.value.meta.endMs - chartDataRef.value.meta.startMs
    : chartDataRef.value.meta.end - chartDataRef.value.meta.start
})

const computedMetricUnit = computed<string>(() => {
  if (!chartDataRef.value.meta?.metricUnits) {
    return ''
  }

  return Object.values(chartDataRef.value.meta.metricUnits)[0]
})

const showLegendValuesRef = computed(() => props.showLegendValues && props.legendPosition !== ChartLegendPosition.Bottom)

const { legendValues } = composables.useChartLegendValues(computedChartData, props.chartOptions.type, computedMetricUnit)

const maxEntitiesShown = computed(() => chartDataRef.value?.meta?.limit?.toString() || null)
const resultSetTruncated = computed(() => chartDataRef.value?.meta?.truncated || false)
const notAllDataShownTooltipContent = i18n.t('limitedResultsShown', { maxReturned: maxEntitiesShown.value })
const isBarChart = computed<boolean>(() => [
  ChartTypes.VERTICAL_BAR.toString(),
  ChartTypes.HORIZONTAL_BAR.toString(),
].includes(chartOptionsRef.value.type))
const isTimeSeriesChart = computed<boolean>(() => {
  return [ChartTypes.TIMESERIES_BAR, ChartTypes.TIMESERIES_LINE].some(e => e === chartOptionsRef.value.type)
})
const isDoughnutChart = computed<boolean>(() => chartOptionsRef.value.type === ChartTypes.DOUGHNUT)

const barChartOrientation = computed<'horizontal' | 'vertical'>(() => chartOptionsRef.value.type.includes('Vertical') ? 'vertical' : 'horizontal')

const metricAxesTitle = computed<string | undefined>(() => {
  if (!chartDataRef.value?.meta.metricNames || !chartDataRef.value?.meta.metricUnits) {
    return undefined
  }

  const metricName = chartDataRef.value.meta.metricNames[0]
  const metricUnit = chartDataRef.value.meta.metricUnits[metricName]
  // @ts-ignore - dynamic i18n key
  return chartOptionsRef.value?.metricAxesTitle || (i18n.te(`chartLabels.${metricName}`) && i18n.te(`chartUnits.${metricUnit}`) &&
    // @ts-ignore - dynamic i18n key
    i18n.t(`chartLabels.${metricName}`, { unit: i18n.t(`chartUnits.${metricUnit}`) })) || undefined
})

const dimensionAxesTitle = computed<string | undefined>(() => {
  const dimension = isTimeSeriesChart.value ? 'Time' : Object.keys(chartDataRef.value.meta.dimensions || chartDataRef.value.meta.metricNames as Object)[0]
  // @ts-ignore - dynamic i18n key
  return chartOptionsRef.value.dimensionAxesTitle || (i18n.te(`chartLabels.${dimension}`) &&
    // @ts-ignore - dynamic i18n key
    i18n.t(`chartLabels.${dimension}`)) || undefined
})

const timestampAxisTitle = computed(() => {
  if (chartDataRef.value.meta.granularity && typeof chartDataRef.value.meta.granularity !== 'number' && 'duration' in (chartDataRef.value.meta.granularity as GranularityFullObj)) {
    const granularity = msToGranularity((chartDataRef.value.meta.granularity as GranularityFullObj).duration)

    // @ts-ignore - dynamic i18n key
    return i18n.t(`granularityAxisTitles.${granularity}`)
  } else if (chartDataRef.value.meta.granularity && !isNaN(Number(chartDataRef.value.meta.granularity))) {
    const granularity = msToGranularity(Number(chartDataRef.value.meta.granularity))

    // @ts-ignore - dynamic i18n key
    return i18n.t(`granularityAxisTitles.${granularity}`)
  }

  // @ts-ignore - dynamic i18n key
  return i18n.t('chartlabels.Time')
})

const emptyMessage = computed(() => ({ title: i18n.t('noDataAvailable'), description: '' }))
const hasValidChartData = computed(() => {
  return chartDataRef.value && chartDataRef.value.meta && chartDataRef.value.records
})

const timeSeriesGranularity = computed<GranularityKeys>(() => {

  if (!chartDataRef.value.meta.granularity) {
    return msToGranularity(
      new Date(chartDataRef.value.records[1].timestamp).getTime() - new Date(chartDataRef.value.records[0].timestamp).getTime(),
    ) || GranularityKeys.HOURLY
  }

  if (typeof chartDataRef.value.meta.granularity === 'number') {
    return msToGranularity(chartDataRef.value.meta.granularity) || GranularityKeys.HOURLY
  }

  return msToGranularity(chartDataRef.value.meta.granularity.duration) || GranularityKeys.HOURLY
})

provide('showLegendValues', showLegendValuesRef)
provide('legendPosition', legendPositionRef)

</script>

<style lang="scss" scoped>
@import '../styles/base';

.tooltip {
  display: flex;
  margin-left: $spacing-sm;
  margin-top: 2px;
}

.limit-icon-wrapper {
  display: flex;
  flex-direction: row;
}

.analytics-chart-parent{
  margin: $spacing-lg;
  &.chart-border {
    border: 1px solid var(--grey-300,  #E7E7EC);
    border-radius: 3px;
    padding: $spacing-md;
  }
}
</style>

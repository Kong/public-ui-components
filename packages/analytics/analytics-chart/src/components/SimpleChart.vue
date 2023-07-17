<template>
  <div class="analytics-chart-shell">
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
      <DoughnutChart
        v-if="isGaugeChart"
        :chart-data="computedChartData"
        :dataset-colors="chartOptions.chartDatasetColors"
        :fill="chartOptions.fill"
        is-simple
        :legend-position="legendPosition"
        :legend-values="legendValues"
        :metric-display="chartOptions.metricDisplay"
        :metric-unit="computedMetricUnit"
        :synthetics-data-key="syntheticsDataKey"
        :width="width"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'
import { AnalyticsChartOptions } from '../types'
import { ChartTypesSimple, ChartLegendPosition } from '../enums'
import DoughnutChart from './chart-types/DoughnutChart.vue'
import { computed, PropType, provide, toRef } from 'vue'
import { AnalyticsExploreResult, AnalyticsExploreV2Result } from '@kong-ui-public/analytics-utilities'
import { datavisPalette } from '../utils'

const props = defineProps({
  chartData: {
    type: Object as PropType<AnalyticsExploreResult | AnalyticsExploreV2Result>,
    required: true,
  },
  chartOptions: {
    type: Object as PropType<AnalyticsChartOptions>,
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
  // chartTitle: {
  //   type: String,
  //   required: true,
  // },
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
})

const { i18n } = composables.useI18n()

const chartDataRef = toRef(props, 'chartData')
const chartOptionsRef = toRef(props, 'chartOptions')
const legendPositionRef = toRef(props, 'legendPosition')

const computedChartData = computed(() => {
  return composables.useExploreResultToDatasets(
    {
      fill: props.chartOptions.fill,
      colorPalette: props.chartOptions.chartDatasetColors || datavisPalette,
    },
    chartDataRef,
  ).value
})

const computedMetricUnit = computed<string>(() => {
  if (!chartDataRef.value.meta?.metricUnits) {
    return ''
  }

  return Object.values(chartDataRef.value.meta.metricUnits)[0]
})

const showLegendValuesRef = computed(() => props.showLegendValues && props.legendPosition !== ChartLegendPosition.Bottom)

const { legendValues } = composables.useChartLegendValues(computedChartData, props.chartOptions.type, computedMetricUnit)

const isGaugeChart = computed<boolean>(() => chartOptionsRef.value.type === ChartTypesSimple.GAUGE)

const emptyStateTitle = computed(() => props.emptyStateTitle || i18n.t('noDataAvailableTitle'))
const emptyStateDescription = computed(() => props.emptyStateDescription || i18n.t('noDataAvailableDescription'))
const hasValidChartData = computed(() => {
  return chartDataRef.value && chartDataRef.value.meta && chartDataRef.value.records.length
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

.analytics-chart-shell {
  border: 1px solid var(--grey-300,  #E7E7EC);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  margin: $spacing-md;
  padding: $spacing-md;

  .chart-title {
    font-size: $font-size-lg;
  }

  .chart-header {
    display: flex;
    padding-bottom: $spacing-md;
  }

  .chart-empty-state {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    padding: $spacing-lg 0 $spacing-md 0;
  }
}

</style>

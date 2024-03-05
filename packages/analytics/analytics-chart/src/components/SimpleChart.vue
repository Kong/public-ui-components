<template>
  <div class="simple-chart-shell">
    <KEmptyState
      v-if="!hasValidChartData"
      :action-button-visible="true"
      class="chart-empty-state"
      data-testid="no-data-in-report"
    >
      <template #title>
        {{ emptyStateTitle }}
      </template>
    </KEmptyState>
    <div
      v-else
      class="analytics-chart-parent"
    >
      <GaugeChart
        v-if="isGaugeChart"
        :chart-data="computedChartData"
        :dataset-colors="chartOptions.chartDatasetColors"
        is-simple
        :metric-display="chartOptions.metricDisplay"
        :metric-unit="computedMetricUnit"
        :numerator="chartOptions.numerator"
        :synthetics-data-key="syntheticsDataKey"
        :width="width"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'
import type { SimpleChartOptions } from '../types'
import { ChartTypesSimple } from '../enums'
import GaugeChart from './chart-types/GaugeChart.vue'
import type { PropType } from 'vue'
import { computed, toRef } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { datavisPalette } from '../utils'

const props = defineProps({
  chartData: {
    type: Object as PropType<ExploreResultV4>,
    required: true,
  },
  chartOptions: {
    type: Object as PropType<SimpleChartOptions>,
    required: true,
  },
  emptyStateTitle: {
    type: String,
    required: false,
    default: '',
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
})

const { i18n } = composables.useI18n()

const computedChartData = computed(() => {
  const chartData = composables.useExploreResultToDatasets(
    {
      colorPalette: props.chartOptions.chartDatasetColors || datavisPalette,
    },
    toRef(props, 'chartData'),
  ).value

  if (props.chartOptions?.reverseDataset) {
    chartData?.datasets.reverse()
  }

  return chartData
})

const computedMetricUnit = computed<string>(() => {
  if (!props.chartData.meta?.metric_units) {
    return ''
  }

  return Object.values(props.chartData.meta.metric_units)[0]
})

const isGaugeChart = computed<boolean>(() => props.chartOptions.type === ChartTypesSimple.GAUGE)

const emptyStateTitle = computed(() => props.emptyStateTitle || i18n.t('noDataAvailableTitle'))
const hasValidChartData = computed(() => {
  return props.chartData && props.chartData.meta && props.chartData.data.length
})
</script>

<style lang="scss" scoped>
@import '../styles/base';
@import '../styles/chart-shell';

.simple-chart-shell {
  margin: $kui-space-0;
  padding: $kui-space-0;

  .chart-empty-state {
    display: flex;
    flex-direction: column;
    height: 100px;
    justify-content: center;
    width: 100px;

    &:deep(.k-empty-state-title-header) {
      font-size: $kui-font-size-20;
      line-height: $kui-line-height-20;
      margin: $kui-space-0;
    }
  }
}
</style>

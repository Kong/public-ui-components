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
      <SingleValue
        v-if="isSingleValueChart"
        :data="chartData"
        :decimal-points="chartOptions.decimalPoints"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import composables from '../composables'
import type { SimpleChartOptions } from '../types'
import GaugeChart from './chart-types/GaugeChart.vue'
import type { PropType } from 'vue'
import { computed, toRef } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { datavisPalette } from '../utils'
import SingleValue from './chart-types/SingleValue.vue'

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

const isGaugeChart = computed<boolean>(() => props.chartOptions.type === 'gauge')
const isSingleValueChart = computed<boolean>(() => props.chartOptions.type === 'single_value')

const emptyStateTitle = computed(() => props.emptyStateTitle || i18n.t('noDataAvailableTitle'))
const hasValidChartData = computed(() => {
  return props.chartData && props.chartData.meta && props.chartData.data.length
})
</script>

<style lang="scss" scoped>
@use "../styles/globals" as *;
@use "../styles/chart-shell";

.simple-chart-shell {
  width: 100%;
  margin: var(--kui-space-0, $kui-space-0);
  padding: var(--kui-space-0, $kui-space-0);

  .chart-empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;

    &:deep(.empty-state-title) {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      margin: var(--kui-space-0, $kui-space-0);
    }
  }
}
</style>

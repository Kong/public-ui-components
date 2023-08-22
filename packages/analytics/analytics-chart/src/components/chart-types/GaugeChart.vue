<template>
  <div
    class="chart-parent"
    data-testid="doughnut-chart-parent"
  >
    <div class="chart-totals-flex">
      <div
        v-if="showMetricLarge"
        class="metric-large"
        data-testid="doughnut-chart-metric"
        :style="metricHighlightColor"
      >
        {{ metricHighlight }}
      </div>
      <div
        v-if="showMetricSmall"
        class="metric-small"
        data-testid="doughnut-chart-total"
      >
        {{ i18n.t('total') }}: {{ metricTotal }}
      </div>
    </div>
    <div
      class="chart-container"
      :style="{height, width}"
    >
      <Doughnut
        ref="chartInstance"
        :chart-id="chartID"
        :data="(mutableData as any)"
        :options="(chartOptions as any)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, toRef } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import { datavisPalette } from '../../utils'
import { v4 as uuidv4 } from 'uuid'
import { Doughnut } from 'vue-chartjs'
import composables from '../../composables'
import type { AnalyticsChartColors, KChartData } from '../../types'
import type { Chart, ChartDataset } from 'chart.js'
import { ChartMetricDisplay } from '../../enums'
import type { DoughnutChartData } from '../../types/chart-data'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
  },
  metricDisplay: {
    type: String as PropType<ChartMetricDisplay>,
    required: false,
    default: ChartMetricDisplay.Hidden,
  },
  syntheticsDataKey: {
    type: String,
    required: false,
    default: '',
  },
  datasetColors: {
    type: Object as PropType<AnalyticsChartColors | string[]>,
    required: false,
    default: datavisPalette,
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

const chartID = ref(uuidv4())
const metricDisplayRef = toRef(props, 'metricDisplay')

// Flatten the datasets into a single element array, since we only want to
// display a single dataset containing dimension totals in our Doughnut chart.
const formattedDataset = computed<DoughnutChartData[]>(() => {
  const formatted = props.chartData.datasets.reduce((acc: any, current: ChartDataset) => {
    acc.labels.push(current.label)
    acc.borderColor.push(current.backgroundColor)
    acc.backgroundColor.push(current.backgroundColor)
    acc.data.push(current.data.reduce((a, b) => (a as number) + (b as number), 0))

    return acc
  }, { labels: [], backgroundColor: [], borderColor: [], data: [] })

  return [formatted]
})

const mutableData = computed(() => {
  return {
    ...props.chartData,
    datasets: formattedDataset.value,
  }
})

composables.useReportChartDataForSynthetics(toRef(props, 'chartData'), toRef(props, 'syntheticsDataKey'))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,

  // Creates the "Gauge" look
  cutout: '78%',
  circumference: '200',
  rotation: '260',

  // Always hide chartjs legend
  plugins: {
    legend: {
      display: false,
    },
  },
}

const chartInstance = ref<Chart>()

// When displaying a simple chart, we only expect two values in the dataset
const metricHighlight = computed(() => approxNum(formattedDataset?.value[0]?.data[0], { capital: true }))
const metricTotal = computed(() => approxNum(formattedDataset?.value[0]?.data[0] + formattedDataset?.value[0]?.data[1], { capital: true }))

const metricHighlightColor = computed(() => `color: ${formattedDataset?.value[0]?.backgroundColor[0]}`)

// Conditionally show large or small metric value, or neither
const showMetricLarge = computed(() => [ChartMetricDisplay.Full, ChartMetricDisplay.SingleMetric].includes(metricDisplayRef.value))
const showMetricSmall = computed(() => metricDisplayRef.value === ChartMetricDisplay.Full)
</script>

<style lang="scss" scoped>
@import '../../styles/base';
@import '../../styles/chart';

.chart-parent {
  height: auto;
  margin: $kui-space-0;
  padding: $kui-space-0;
  width: auto;

  .chart-container {
    margin: $kui-space-0;
    max-height: 100px;
    max-width: 100px;
    padding: $kui-space-0;
  }

  .chart-totals-flex {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100px;
    justify-content: center;
    padding: $kui-space-80 $kui-space-0 $kui-space-0;
    position: absolute;
    width: 100px;
    z-index: 2;

    .metric-large {
      font-size: $kui-font-size-70;
      font-weight: $kui-font-weight-medium;
      line-height: $kui-line-height-70;
    }
    .metric-small {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-10;
      font-weight: $kui-font-weight-regular;
      line-height: $kui-line-height-10;
    }
  }
}
</style>

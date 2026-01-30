<template>
  <div
    class="chart-parent"
    data-testid="gauge-chart-parent"
  >
    <div class="chart-totals-flex">
      <div
        v-if="showMetricLarge"
        class="metric-large"
        data-testid="gauge-chart-metric"
        :style="metricHighlightColor"
      >
        {{ metricHighlight }}
      </div>
      <div
        v-if="showMetricSmall"
        class="metric-small"
        data-testid="gauge-chart-total"
      >
        {{ i18n.t('total') }}: {{ metricTotal }}
      </div>
    </div>
    <div
      class="chart-container"
      :style="{ height, width }"
    >
      <Doughnut
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
import type { AnalyticsChartColors, KChartData, SimpleChartMetricDisplay } from '../../types'
import type { ChartDataset } from 'chart.js'
import type { DonutChartData } from '../../types/chart-data'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
  },
  metricDisplay: {
    type: String as PropType<SimpleChartMetricDisplay>,
    required: false,
    default: 'hidden',
  },
  numerator: {
    type: Number,
    required: false,
    default: 0,
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

// Flatten the datasets into a single element array, since we only want to
// display a single dataset containing dimension totals in our Donut chart.
const formattedDataset = computed<DonutChartData[]>(() => {
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

// The large metric value displayed in the center can be specified; otherwise, default to the first value in the dataset
const metricHighlight = computed(() => approxNum(formattedDataset?.value[0]?.data[props.numerator], { capital: true }))

// When displaying a simple chart, we only expect two values in the dataset
const metricTotal = computed(() => {
  const v0 = formattedDataset?.value?.[0]?.data?.[0] ?? 0
  const v1 = formattedDataset?.value?.[0]?.data?.[1] ?? 0
  return approxNum(v0 + v1, { capital: true })
})

// Large metric color should match filled in gauge color
const metricHighlightColor = computed(() => `color: ${formattedDataset?.value[0]?.backgroundColor[props.numerator]}`)

// Conditionally show large or small metric value, or neither
const showMetricLarge = computed(() => ['full', 'single'].includes(props.metricDisplay))
const showMetricSmall = computed(() => props.metricDisplay === 'full')
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";

.chart-parent {
  height: auto;
  margin: var(--kui-space-0, $kui-space-0);
  padding: var(--kui-space-0, $kui-space-0);
  width: auto;

  .chart-container {
    margin: var(--kui-space-0, $kui-space-0);
    max-height: 100px;
    max-width: 100px;
    padding: var(--kui-space-0, $kui-space-0);
  }

  .chart-totals-flex {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100px;
    justify-content: center;
    padding: var(--kui-space-80, $kui-space-80)
      var(--kui-space-0, $kui-space-0)
      var(--kui-space-0, $kui-space-0);
    position: absolute;
    width: 100px;
    z-index: 2;

    .metric-large {
      font-size: var(--kui-font-size-60, $kui-font-size-60);
      font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
      line-height: var(--kui-line-height-50, $kui-line-height-50);
    }

    .metric-small {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      font-size: var(--kui-font-size-10, $kui-font-size-10);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      line-height: var(--kui-line-height-10, $kui-line-height-10);
    }
  }
}
</style>

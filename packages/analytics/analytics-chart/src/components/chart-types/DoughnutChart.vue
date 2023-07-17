<template>
  <div
    class="chart-parent"
    :class="[ chartFlexClass, { 'show-total': isSimple } ]"
    data-testid="doughnut-chart-parent"
  >
    <div
      v-if="isSimple"
      class="chart-totals"
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
    </div>
    <div
      class="chart-container"
      :style="{height, width}"
    >
      <Doughnut
        ref="chartInstance"
        :chart-id="chartID"
        :data="(mutableData as any)"
        :options="(options as any)"
        :plugins="[htmlLegendPlugin]"
      />
      <ToolTip
        :left="tooltipData.left"
        :series="tooltipData.tooltipSeries"
        :show-tooltip="tooltipData.showTooltip"
        :tooltip-title="tooltipTitle"
        :top="tooltipData.top"
        :unit="metricUnit"
        @dimensions="tooltipDimensions"
      />
    </div>
    <HtmlLegend
      :id="legendID"
      :chart-instance="chartInstance"
      :items="legendItems"
      :position="legendPosition"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, reactive, ref, toRef } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import HtmlLegend from '../chart-plugins/ChartLegend.vue'
import {
  datavisPalette,
  darkenColor,
} from '../../utils'
import { v4 as uuidv4 } from 'uuid'
import { Doughnut } from 'vue-chartjs'
import composables from '../../composables'
import { AnalyticsChartColors, KChartData, TooltipState } from '../../types'
import { Chart, ChartDataset } from 'chart.js'
import { ChartLegendPosition, ChartMetricDisplay, ChartTypes } from '../../enums'
import { DoughnutChartData } from '../../types/chart-data'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
  },
  chartTitle: {
    type: String,
    required: false,
    default: null,
  },
  fill: {
    type: Boolean,
    required: false,
    default: false,
  },
  isSimple: {
    type: Boolean,
    required: false,
    default: false,
  },
  tooltipTitle: {
    type: String,
    required: false,
    default: null,
  },
  metricUnit: {
    type: String,
    required: false,
    default: '',
  },
  timeRange: {
    type: Number,
    required: false,
    default: 0,
  },
  legendPosition: {
    type: String as PropType<`${ChartLegendPosition}`>,
    required: false,
    default: ChartLegendPosition.Right,
  },
  legendValues: {
    type: Object,
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

const legendID = ref(uuidv4())
const chartID = ref(uuidv4())
const legendItems = ref([])

const unitsRef = toRef(props, 'metricUnit')
const translatedUnits = computed(() => {
  // @ts-ignore - dynamic i18n key
  return unitsRef.value && i18n.t(`chartUnits.${unitsRef.value}`)
})
const metricDisplayRef = toRef(props, 'metricDisplay')

const tooltipData: TooltipState = reactive({
  showTooltip: false,
  tooltipContext: '',
  tooltipSeries: [],
  left: '',
  top: '',
  units: translatedUnits,
  offset: 0,
  width: 0,
  height: 0,
  chartType: ChartTypes.DOUGHNUT,
})

const htmlLegendPlugin = {
  id: legendID.value,
  afterUpdate(chart: Chart) {
    // @ts-ignore - chart js options internally, are not well typed
    legendItems.value = chart.options.plugins.legend.labels.generateLabels(chart)
      .map(e => {
        return {
          ...e,
          value: props.legendValues && props.legendValues[e.text],
          hidden: false,
        }
      })
  },
}

// Flatten the datasets into a single element array, since we only want to
// display a single dataset containing dimension totals in our Doughnut chart.
const formattedDataset = computed<DoughnutChartData[]>(() => {
  const formatted = props.chartData.datasets.reduce((acc: any, current: ChartDataset) => {
    acc.labels.push(current.label)

    // Doughnut Metric chart should have no segment border
    props.isSimple
      ? acc.borderColor.push(current.backgroundColor)
      : acc.borderColor.push(darkenColor((current.backgroundColor as string), 50))

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

const { options } = composables.useDoughnutChartOptions({
  tooltipState: tooltipData,
  timeRange: toRef(props, 'timeRange'),
  legendID: legendID.value,
  isSimple: toRef(props, 'isSimple'),
})

const chartInstance = ref<Chart>()

/**
 * When in Preview mode, Chart and Legend are vertically stacked, and the
 * Legend list items are allowed to spread horizontally.
 */
const chartFlexClass = computed<string>(() => {
  return {
    [ChartLegendPosition.Right]: 'legend-row',
    [ChartLegendPosition.Bottom]: 'column',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[props.legendPosition]
})

const tooltipDimensions = ({ width, height }: { width: number, height: number }) => {
  tooltipData.width = width
  tooltipData.height = height
}

// When displaying a simple chart, we only expect two values in the dataset
const metricHighlight = computed(() => approxNum(formattedDataset?.value[0]?.data[0], { capital: true }))
const metricTotal = computed(() => approxNum(formattedDataset?.value[0]?.data[0] + formattedDataset?.value[0]?.data[1], { capital: true }))

const metricHighlightColor = computed(() => `color: ${formattedDataset?.value[0]?.backgroundColor[0]}`)

// Conditionally show large or small metric value, or neither
const showMetricLarge = computed(() => [ChartMetricDisplay.Full, ChartMetricDisplay.Single].includes(metricDisplayRef.value))
const showMetricSmall = computed(() => metricDisplayRef.value === ChartMetricDisplay.Full)
</script>

<style lang="scss" scoped>
@import '../../styles/base';
@import '../../styles/chart';

.chart-parent {
  // MA-1850 Custom styling for Gauge chart
  &.show-total {
    height: auto;
    margin: 0;
    padding: 0;
    width: auto;

    .chart-container {
      margin: 0;
      max-height: 100px;
      max-width: 100px;
      padding: 0;
    }

    .chart-totals {
      align-items: center;
      display: flex;
      height: 100px;
      justify-content: center;
      padding: 25px 0 0;
      position: absolute;
      width: 100px;
      z-index: 1;

      .chart-totals-flex {
        align-items: center;
        display: flex;
        flex-direction: column;
        z-index: 2;

        .metric-large {
          font-size: 23px;
          font-weight: 500;
          line-height: 23px;
        }
        .metric-small {
          color: var(--grey-500, #6F7787);
          font-size: 9px;
          font-weight: 400;
          line-height: 9px;
        }
      }
    }
  }
}
</style>

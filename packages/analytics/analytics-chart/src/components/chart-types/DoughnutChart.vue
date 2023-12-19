<template>
  <div
    class="chart-parent"
    :class="chartFlexClass(legendPosition)"
    data-testid="doughnut-chart-parent"
  >
    <div
      class="chart-container"
    >
      <Doughnut
        ref="chartInstance"
        :chart-id="chartID"
        :data="(mutableData as any)"
        :options="(options as any)"
        :plugins="(plugins as any)"
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
import type { PropType, Ref } from 'vue'
import { computed, reactive, ref, toRef } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import HtmlLegend from '../chart-plugins/ChartLegend.vue'
import {
  datavisPalette,
  darkenColor,
} from '../../utils'
import { v4 as uuidv4 } from 'uuid'
import { Doughnut } from 'vue-chartjs'
import composables from '../../composables'
import type { AnalyticsChartColors, KChartData, TooltipState } from '../../types'
import type { Chart, ChartDataset, Plugin } from 'chart.js'
import { ChartLegendPosition, ChartTypes } from '../../enums'
import type { DoughnutChartData } from '../../types/chart-data'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
  },
  fill: {
    type: Boolean,
    required: false,
    default: false,
  },
  tooltipTitle: {
    type: String,
    required: true,
  },
  metricUnit: {
    type: String,
    required: false,
    default: '',
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
})

const { translateUnit } = composables.useTranslatedUnits()

const legendID = ref(uuidv4())
const chartID = ref(uuidv4())
const legendItems = ref([])

const tooltipData: TooltipState = reactive({
  showTooltip: false,
  tooltipContext: '',
  tooltipSeries: [],
  left: '',
  top: '',
  units: props.metricUnit,
  translateUnit,
  offset: 0,
  width: 0,
  height: 0,
  chartType: ChartTypes.DOUGHNUT,
})

const htmlLegendPlugin: Plugin = {
  id: legendID.value,
  afterUpdate(chart: Chart) {
    // @ts-ignore - chart js options internally, are not well typed
    legendItems.value = chart.options.plugins.legend.labels.generateLabels(chart)
      .map(e => ({ ...e, value: props.legendValues && props.legendValues[e.text], hidden: false }))
  },
}

const plugins: Ref<Plugin[]> = computed(() => [htmlLegendPlugin])

// Flatten the datasets into a single element array, since we only want to
// display a single dataset containing dimension totals in our Doughnut chart
const formattedDataset = computed<DoughnutChartData[]>(() => {
  const formatted = props.chartData.datasets.reduce((acc: any, current: ChartDataset) => {
    acc.labels.push(current.label)
    acc.backgroundColor.push(current.backgroundColor)
    acc.borderColor.push(darkenColor((current.backgroundColor as string), 50))
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
  legendID: legendID.value,
})

const chartInstance = ref<Chart>()

/**
 * When in Preview mode, Chart and Legend are vertically stacked, and the
 * Legend list items are allowed to spread horizontally.
 */
const chartFlexClass = (position: `${ChartLegendPosition}`) => {
  return {
    [ChartLegendPosition.Right]: 'legend-row',
    [ChartLegendPosition.Bottom]: 'column',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[position]
}

const tooltipDimensions = ({ width, height }: { width: number, height: number }) => {
  tooltipData.width = width
  tooltipData.height = height
}
</script>

<style lang="scss" scoped>
@import '../../styles/base';
@import '../../styles/chart';
</style>

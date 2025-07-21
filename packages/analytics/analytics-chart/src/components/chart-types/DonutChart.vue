<template>
  <div
    ref="chartParentRef"
    class="chart-parent"
    :class="chartFlexClass(legendPosition)"
    data-testid="donut-chart-parent"
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
      <Teleport to="body">
        <ToolTip
          :absolute-left="tooltipAbsoluteLeft"
          :absolute-top="tooltipAbsoluteTop"
          :state="tooltipData"
          :tooltip-title="tooltipTitle"
          :unit="metricUnit"
          @dimensions="tooltipDimensions"
        />
      </Teleport>
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
import { computed, reactive, ref, toRef, useTemplateRef } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import HtmlLegend from '../chart-plugins/ChartLegend.vue'
import {
  datavisPalette,
  darkenColor,
} from '../../utils'
import { Doughnut } from 'vue-chartjs'
import composables from '../../composables'
import type { AnalyticsChartColors, KChartData, TooltipState } from '../../types'
import type { Chart, ChartDataset, Plugin } from 'chart.js'
import { ChartLegendPosition } from '../../enums'
import type { DonutChartData } from '../../types/chart-data'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
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

const legendID = crypto.randomUUID()
const chartID = crypto.randomUUID()
const legendItems = ref([])
const chartParentRef = useTemplateRef('chartParentRef')

const tooltipData: TooltipState = reactive({
  showTooltip: false,
  tooltipContext: '',
  tooltipSeries: [],
  left: '',
  top: '',
  units: toRef(props, 'metricUnit'),
  translateUnit,
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartID,
  chartType: 'donut',
  interactionMode: 'idle',
})

const { tooltipAbsoluteLeft, tooltipAbsoluteTop } = composables.useTooltipAbsolutePosition(
  chartParentRef,
  tooltipData,
)

const htmlLegendPlugin: Plugin = {
  id: legendID,
  afterUpdate(chart: Chart) {
    // @ts-ignore - chart js options internally, are not well typed
    legendItems.value = chart.options.plugins.legend.labels.generateLabels(chart)
      .map(e => ({ ...e, value: props.legendValues && props.legendValues[e.text], hidden: false }))
  },
}

const plugins: Ref<Plugin[]> = computed(() => [htmlLegendPlugin])

// Flatten the datasets into a single element array, since we only want to
// display a single dataset containing dimension totals in our Donut chart
const formattedDataset = computed<DonutChartData[]>(() => {
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

const { options } = composables.useDonutChartOptions({
  tooltipState: tooltipData,
  legendID: legendID,
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
@use "../../styles/globals" as *;
@use "../../styles/chart";
</style>

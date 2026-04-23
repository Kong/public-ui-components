<template>
  <div
    ref="chartParent"
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
      <div
        v-if="showCenterMetric && isSummable"
        class="chart-center-metric"
      >
        <span class="chart-center-total">{{ grandTotal }}</span>
        <span
          v-if="centerMetricLabel"
          class="chart-center-unit"
        >{{ centerMetricLabel }}</span>
      </div>
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
import type { Ref } from 'vue'
import { computed, reactive, ref, toRef, useTemplateRef } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import HtmlLegend from '../chart-plugins/ChartLegend.vue'
import {
  datavisPalette,
  darkenColor,
  isSummableMetricUnit,
} from '../../utils'
import { Doughnut } from 'vue-chartjs'
import composables from '../../composables'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartColors, KChartData, TooltipState } from '../../types'
import type { Chart, ChartDataset, Plugin } from 'chart.js'
import { ChartLegendPosition } from '../../enums'
import type { DonutChartData, LegendValues } from '../../types/chart-data'

const props = withDefaults(defineProps<{
  chartData: KChartData
  tooltipTitle: string
  metricUnit?: string
  legendPosition?: `${ChartLegendPosition}`
  legendValues?: LegendValues
  syntheticsDataKey?: string
  datasetColors?: AnalyticsChartColors | string[]
  tooltipDimensionDisplay?: string
  tooltipMetricDisplay?: string
  showCenterMetric?: boolean
}>(), {
  metricUnit: '',
  legendPosition: ChartLegendPosition.Bottom,
  legendValues: undefined,
  syntheticsDataKey: '',
  datasetColors: () => datavisPalette,
  tooltipDimensionDisplay: '',
  tooltipMetricDisplay: '',
  showCenterMetric: false,
})

const { translateUnit } = composables.useTranslatedUnits()
const { i18n } = composables.useI18n()

const legendID = crypto.randomUUID()
const chartID = crypto.randomUUID()
const legendItems = ref([])
const chartParentRef = useTemplateRef<HTMLDivElement>('chartParent')

const tooltipData: TooltipState = reactive({
  showTooltip: false,
  tooltipContext: '',
  metricDisplay: toRef(props, 'tooltipMetricDisplay'),
  dimensionDisplay: toRef(props, 'tooltipDimensionDisplay'),
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
    acc.hoverBorderColor.push(darkenColor(current.backgroundColor as string, 50))
    acc.data.push(current.data.reduce((a, b) => (a as number) + (b as number), 0))

    return acc
  }, {
    labels: [],
    backgroundColor: [],
    borderColor: '#ffffff',
    borderWidth: 3,
    hoverBorderColor: [],
    hoverBorderWidth: 3,
    data: [],
    hoverOffset: 10,
  })

  return [formatted]
})

const { formatUnit } = unitFormatter({ i18n })

const isSummable = computed(() => isSummableMetricUnit(props.metricUnit))

const grandTotal = computed(() => {
  const sum = formattedDataset.value[0]?.data.reduce((a, b) => a + b, 0) ?? 0
  return formatUnit(sum, props.metricUnit, {
    approximate: true,
    translateUnit: (unit, value) => isSummableMetricUnit(unit) && unit !== 'usd' ? '' : translateUnit(unit, value),
  }).trim()
})

const centerMetricLabel = computed(() => props.tooltipMetricDisplay || '')

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

.chart-center-metric {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  left: 50%;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);

  .chart-center-total {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-70, $kui-font-size-70);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: 1.1;
  }

  .chart-center-unit {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    margin-top: var(--kui-space-10, $kui-space-10);
  }
}
</style>

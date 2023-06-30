<template>
  <div
    class="chart-parent"
    :class="chartFlexClass(legendPosition)"
    data-testid="line-chart-parent"
  >
    <div
      class="chart-container"
      :style="{height, width}"
    >
      <Line
        v-if="type === ChartTypes.TIMESERIES_LINE"
        ref="chartInstance"
        :chart-id="chartID"
        :data="(mutableData as any)"
        data-testid="time-series-line-chart"
        :options="(options as any)"
        :plugins="plugins"
      />
      <Bar
        v-else-if="type === ChartTypes.TIMESERIES_BAR"
        ref="chartInstance"
        :chart-id="chartID"
        :data="(mutableData as any)"
        data-testid="time-series-bar-chart"
        :options="(options as any)"
        :plugins="plugins"
      />
    </div>
    <ToolTip
      ref="tooltipElement"
      :context="formatTimestamp(tooltipData.tooltipContext as number)"
      data-testid="tooltip"
      :left="tooltipData.left"
      :series="tooltipData.tooltipSeries"
      :show-tooltip="tooltipData.showTooltip"
      :tooltip-title="tooltipTitle"
      :top="tooltipData.top"
      :unit="metricUnit"
      @dimensions="tooltipDimensions"
    />
    <ChartLegend
      :id="legendID"
      :chart-instance="chartInstance"
      data-testid="legend"
      :items="legendItems"
    />
  </div>
</template>

<script setup lang="ts">

import { reactive, ref, computed, toRef, PropType, inject } from 'vue'
import 'chartjs-adapter-date-fns'
import 'chart.js/auto'
import { verticalLinePlugin } from '../chart-plugins/VerticalLinePlugin'
import ToolTip from '../chart-plugins/ChartTooltip.vue'
import ChartLegend from '../chart-plugins/ChartLegend.vue'
import {
  formatTime,
  datavisPalette,
  darkenColor,
} from '../../utils'
import { v4 as uuidv4 } from 'uuid'
import { Line, Bar } from 'vue-chartjs'
import composables from '../../composables'
import { AnalyticsChartColors, KChartData, LegendValues, TooltipState } from '../../types'
import { GranularityKeys } from '@kong-ui-public/analytics-utilities'
import { Chart } from 'chart.js'
import { ChartLegendPosition, ChartTypes } from '../../enums'

const props = defineProps({
  chartData: {
    type: Object as PropType<KChartData>,
    required: false,
    default: null,
  },
  type: {
    type: String as PropType<ChartTypes.TIMESERIES_BAR | ChartTypes.TIMESERIES_LINE>,
    required: false,
    default: ChartTypes.TIMESERIES_LINE,
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
  timeRangeMs: {
    type: Number,
    required: false,
    default: undefined,
  },
  timeRangeSec: {
    type: Number,
    required: false,
    default: undefined,
  },
  granularity: {
    type: String as PropType<`${GranularityKeys}`>,
    required: true,
  },
  stacked: {
    type: Boolean,
    required: false,
    default: true,
  },
  legendValues: {
    type: Object as PropType<LegendValues>,
    required: false,
    default: null,
  },
  metricAxesTitle: {
    type: String,
    required: false,
    default: null,
  },
  dimensionAxesTitle: {
    type: String,
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
const chartInstance = ref<Chart>()
const legendID = ref(uuidv4())
const chartID = ref(uuidv4())
const legendItems = ref([])
const unitsRef = toRef(props, 'metricUnit')
const tooltipElement = ref()
const legendPosition = ref(inject('legendPosition', ChartLegendPosition.Right))

const translatedUnits = computed(() => {
  // @ts-ignore - dynamic i18n key
  return unitsRef.value && i18n.t(`chartUnits.${unitsRef.value}`)
})
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
  chartType: props.type,
})

const htmlLegendPlugin = {
  id: legendID.value,
  afterUpdate(chart: Chart) {
    // @ts-ignore - ChartJS types are incomplete
    legendItems.value = chart.options.plugins.legend.labels.generateLabels(chart)
      .map(e => ({ ...e, value: props.legendValues && props.legendValues[e.text] }))
      .sort((a, b) => a.value && b.value && b.value.raw - a.value.raw)
  },
}

const plugins = computed(() => [htmlLegendPlugin, ...(props.type === ChartTypes.TIMESERIES_LINE ? [verticalLinePlugin] : [])])

const { options } = composables.useLinechartOptions({
  tooltipState: tooltipData,
  timeRangeMs: toRef(props, 'timeRangeMs'),
  timeRangeSec: toRef(props, 'timeRangeSec'),
  granularity: toRef(props, 'granularity'),
  legendID: legendID.value,
  stacked: toRef(props, 'stacked'),
  metricAxesTitle: toRef(props, 'metricAxesTitle'),
  dimensionAxesTitle: toRef(props, 'dimensionAxesTitle'),
})

const mutableData = computed(() => {
  return {
    ...props.chartData,
    datasets: props.chartData.datasets.map((e, i) => {
      if (Array.isArray(props.datasetColors)) {
        e.backgroundColor = props.datasetColors[i % props.datasetColors.length]
        e.borderColor = darkenColor(e.backgroundColor, 50)
      } else if (e.rawDimension in props.datasetColors) {
        e.backgroundColor = props.datasetColors[e.rawDimension]
        e.borderColor = darkenColor(e.backgroundColor, 50)
      }
      e.fill = toRef(props, 'fill').value
      return e
    }),
  }
})

composables.useReportChartDataForSynthetics(toRef(props, 'chartData'), toRef(props, 'syntheticsDataKey'))

const formatTimestamp = (ts: number): string | number => {
  return formatTime(ts, { short: [GranularityKeys.DAILY, GranularityKeys.WEEKLY].includes(props.granularity as GranularityKeys) })
}

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

// @ts-ignore
const tooltipDimensions = ({ width, height }) => {
  tooltipData.width = width
  tooltipData.height = height
}

</script>

<style lang="scss" scoped>
@import '../../styles/base';
@import '../../styles/chart';

</style>

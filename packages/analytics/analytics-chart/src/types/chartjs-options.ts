import type { Ref } from 'vue'
import type { Chart, ChartType, TooltipModel, Color } from 'chart.js'
import type { ChartTypes } from '../enums'
import type { GranularityKeys } from '@kong-ui-public/analytics-utilities'

export interface TooltipEntry {
  backgroundColor: Color
  borderColor: Color
  label: string
  value: string | number
  rawValue: number
}

export type ChartTooltipSortFn = (a: TooltipEntry, b: TooltipEntry) => number

export interface TooltipState {
  showTooltip: boolean,
  tooltipContext: string | number,
  tooltipSeries: Array<TooltipEntry>,
  left: string,
  top: string,
  units: string, // units are untranslated
  translateUnit: (unit: string, value: number) => string,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number
  chartType: ChartTypes,
  locked?: boolean,
  chartTooltipSortFn?: ChartTooltipSortFn
}

interface BaseChartOptions {
  tooltipState: TooltipState,
  legendID: string,
  stacked: Ref<boolean>, // stacked true or false
  metricAxesTitle?: Ref<string>, // metric axes title to display
  dimensionAxesTitle?: Ref<string> // dimension axes title to display
}

export interface BarChartOptions extends BaseChartOptions {
  indexAxis: 'x' | 'y', // index axes x or y
  numLabels: Ref<number>, // number of axis labels in dataset
}

export interface LineChartOptions extends BaseChartOptions {
  timeRangeSec: Ref<number | undefined>, // time range in seconds
  timeRangeMs: Ref<number | undefined>, // time range in seconds
  granularity: Ref<`${GranularityKeys}`>,
}

export interface DoughnutChartOptions {
  tooltipState: TooltipState,
  legendID: string,
}

export interface AxesTooltipState {
  show: boolean,
  left: string,
  top: string,
  text: string,
  offset: number
}

export interface ExternalTooltipContext {
  chart: Chart,
  tooltip: TooltipModel<ChartType>,
}

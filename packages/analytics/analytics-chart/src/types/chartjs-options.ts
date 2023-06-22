import { Ref } from 'vue'
import { Chart, ChartType, TooltipModel } from 'chart.js'
import { ChartTypes } from '../enums'
import { GranularityKeys } from '@kong-ui-public/analytics-utilities'
export interface TooltipState {
  showTooltip: boolean,
  tooltipContext: string | number,
  tooltipSeries: Array<any>,
  left: string,
  top: string,
  units: string,
  offset: number,
  width: number,
  height: number
  chartType: ChartTypes
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
}

export interface LineChartOptions extends BaseChartOptions {
  timeRange: Ref<number>, // time range in seconds
  granularity: Ref<`${GranularityKeys}`>,
}

export interface DoughnutChartOptions {
  tooltipState: TooltipState,
  legendID: string,
  timeRange: Ref<number>, // time range in seconds
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

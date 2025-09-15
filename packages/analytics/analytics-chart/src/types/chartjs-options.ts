import type { Ref, ComputedRef } from 'vue'
import type { Chart, ChartType as ChartJsChartType, TooltipModel, Color } from 'chart.js'
import type { ChartType } from './chart-types'
import type { ExploreAggregations, GranularityValues } from '@kong-ui-public/analytics-utilities'
import type { Threshold } from './chart-data'

export interface TooltipEntry {
  backgroundColor: Color
  borderColor: Color
  label: string
  value: string | number
  rawValue: number
  isSegmentEmpty?: boolean
}

export type ChartTooltipSortFn = (a: TooltipEntry, b: TooltipEntry) => number
export type TooltipInteractionMode = 'idle' | 'interactive' | 'zoom-interactive' | 'selecting-chart-area'

export interface TooltipState {
  showTooltip: boolean
  tooltipContext: string | number
  tooltipSeries: TooltipEntry[]
  left: string
  top: string
  units: string // units are untranslated
  translateUnit: (unit: string, value: number) => string
  offsetX: number
  offsetY: number
  width: number
  height: number
  chartType: ChartType
  chartID: string
  chartTooltipSortFn?: ChartTooltipSortFn
  interactionMode: TooltipInteractionMode
  metricDisplay: string
  dimensionDisplay?: string
}

interface BaseChartOptions {
  tooltipState: TooltipState
  legendID: string
  stacked: Ref<boolean> // stacked true or false
  metricAxesTitle?: Ref<string | undefined> // metric axes title to display
  dimensionAxesTitle?: Ref<string | undefined> // dimension axes title to display
}

export interface BarChartOptions extends BaseChartOptions {
  indexAxis: 'x' | 'y' // index axes x or y
  numLabels: Ref<number> // number of axis labels in dataset
}

export interface LineChartOptions extends BaseChartOptions {
  timeRangeMs: Ref<number | undefined> // time range in seconds
  granularity: Ref<GranularityValues>
  pointsWithoutHover?: ComputedRef<boolean | undefined>
  threshold?: Readonly<Ref<Record<ExploreAggregations, Threshold[]> | undefined>>
}

export interface DonutChartOptions {
  tooltipState: TooltipState
  legendID: string
}

export interface AxesTooltipState {
  show: boolean
  left: string
  top: string
  text: string
  offset: number
}

export interface ExternalTooltipContext {
  chart: Chart
  tooltip: TooltipModel<ChartJsChartType>
}

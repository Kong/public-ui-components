export const DIMENSION_COUNTRY_CODE = 'country_code' as const
export const STATUS_CODE_DIMENSIONS = ['status_code', 'status_code_grouped'] as const
export const EMPTY_SEGMENT_ID = 'empty' as const

export type ThresholdType = 'warning' | 'error' | 'neutral'

export interface Threshold {
  type: ThresholdType
  value: number
  label?: string
  highlightIntersections?: boolean
}

export interface ExternalLink {
  href: string
}

export type ChartType =
  | 'donut'
  | 'horizontal_bar'
  | 'vertical_bar'
  | 'timeseries_line'
  | 'timeseries_bar'

export type LegendPosition = 'bottom' | 'hidden'

export interface AnalyticsDataPoint {
  x: number
  y: number
}

export interface AnalyticsChartColors {
  [dimensionValue: string]: string
}

export interface DatasetLabel {
  id: string
  name: string
}

export interface Dataset {
  label?: string
  rawDimension: string
  rawMetric?: string
  total?: number
  fill?: boolean
  isThreshold?: boolean
  isSegmentEmpty?: boolean
  backgroundColor?: string
  borderColor?: string
  data: Array<number | AnalyticsDataPoint>
}

export interface KChartData {
  datasets: Dataset[]
  labels?: string[]
  isLabelEmpty?: boolean[]
  isMultiDimension?: boolean
}

export interface LegendValueEntry {
  raw: number
  formatted: string
  isThreshold?: boolean
}

export interface LegendValues {
  [label: string]: LegendValueEntry
}

export interface ChartLegendItem {
  label: string
  color: string
  borderColor: string
  value?: LegendValueEntry
  isSegmentEmpty?: boolean
  hidden?: boolean
}

export type ChartLegendSortFn = (a: ChartLegendItem, b: ChartLegendItem) => number

export interface TooltipEntry {
  backgroundColor: string
  borderColor: string
  label: string
  value: string | number
  rawValue: number
  isSegmentEmpty?: boolean
}

export type ChartTooltipSortFn = (a: TooltipEntry, b: TooltipEntry) => number
export type TooltipInteractionMode = 'idle' | 'interactive' | 'zoom-interactive' | 'selecting-chart-area'

export interface TooltipState {
  interactionMode: TooltipInteractionMode
  entries: TooltipEntry[]
  visible: boolean
  top: number
  left: number
  title?: string
  subtitle?: string
  metricDisplay?: string
}

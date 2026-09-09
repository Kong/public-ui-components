import type { ChartData, ChartDataset, LegendItem } from 'chart.js'
import type { ChartTooltipSortFn } from './chartjs-options'
import type { ChartType, SimpleChartType } from './chart-types'
import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'

// Chart.js extended interfaces
export type Dataset = ChartDataset & {
  rawDimension: string
  rawMetric?: string
  total?: number
  lineTension?: number
  fill?: boolean
  isThreshold?: boolean
  isSegmentEmpty?: boolean
}

export interface KChartData extends ChartData {
  datasets: Dataset[]
  labels?: string[]
  isLabelEmpty?: boolean[]
  isMultiDimension?: boolean
  outlierValue?: number
}

export interface AnalyticsDataPoint {
  x: number
  y: number
}

/**
 * A label for the chart tooltip instead of using the dataset's label.
 * Scatter plots need this for outliers as they would show the "Outlier..." label
 */
export interface LabeledDataPoint extends AnalyticsDataPoint {
  tooltipLabel?: string
}

/**
 * Dimension value to color hex code mapping
 * for custom color palettes
 *
 * Use for deterministic dimension values for example
 * graphing requests by status code over time, dimensions
 * are known ahead of time they will be 2xx, 3xx, 4xx, 5xx
 */
export interface AnalyticsChartColors {
  [dimensionValue: string]: string
}

export interface LegendValueEntry {
  raw: number
  formatted: string
  isThreshold?: boolean
}

/**
 * Legend item with enhanced value
 */
export interface EnhancedLegendItem extends LegendItem {
  value: LegendValueEntry
  text: string
  isSegmentEmpty?: boolean
}

/**
 * Chart dataset sort function
 */
export type ChartLegendSortFn = (a: EnhancedLegendItem, b: EnhancedLegendItem) => number

export type ThresholdType = 'warning' | 'error' | 'neutral'

export interface Threshold {
  type: ThresholdType
  value: number
  label?: string
  highlightIntersections?: boolean
}

/**
 * A horizontal reference line drawn at a percentile of the plotted y-values.
 */
export interface ScatterPercentileLine {
  /**
   * Percentile to draw, 0 to 100.
   */
  percentile: number
  /**
   * Overrides the default label.
   */
  label?: string
  /**
   * Dash pattern for the line, defaults to a dashed [5, 5].
   */
  borderDash?: number[]
  /**
   * Line color, defaults to neutral text for the median, danger for anything above it.
   */
  color?: string
}

/**
 * TODO: The percentile math for median and outliers are not perfect, these need to be updated
 *       to actually display/inform the user of what is happening. So for now, the percentiles and
 *       median lines will default to none.
 *
 *       e.g. Fix the splitting of the outliers datasets from the original datasets, labels in
 *            the legend that explain what they are doing (or removed completely), better
 *            styling to differentiate the median/outliers
 */
export interface ScatterOptions {
  /**
   * Reference lines derived from the plotted y-values, defaults to none.
   */
  percentileLines?: ScatterPercentileLine[]
  /**
   * Percentile above which points are split into a separate "outlier" dataset,
   * defaults to undefined (every point stays in its own series).
   */
  outlierPercentile?: number
  /**
   * Shade the chart region above `outlierPercentile`, defaults to false.
   */
  shadeOutlierRegion?: boolean
  /**
   * Maximum horizontal jitter, applied to points so that records sharing a timestamp
   * don't stack into a single column, defaults to 0 (no jitter).
   */
  jitterMs?: number
  /**
   * Radius of each plotted point, defaults to 2.
   */
  pointRadius?: number
  /**
   * Opacity of the plotted points between 0 and 1, defaults to 0.6
   * Doesn't apply to outlier points
   */
  pointOpacity?: number
}

/**
 * Analytics Chart options
 */
export interface AnalyticsChartOptions {
  /**
   * Chart type
   */
  type: ChartType
  /**
   * Are the datasets stacked or not.
   * If stacked, the datasets are stacked on top of each other.
   * Applies to timeseries charts as well as bar charts.
   */
  stacked?: boolean
  /**
   * Title to display for the metric axis
   * If not provided, show nothing
   */
  metricAxesTitle?: string
  /**
   * Title to display for the dimension axis
   * If not provided, show nothing
   */
  dimensionAxesTitle?: string
  /**
   * Chart dataset color palette
   */
  chartDatasetColors?: AnalyticsChartColors | string[]
  /**
   * Sort the datasets as they are displayed in the legend and tooltip
   */
  chartLegendSortFn?: ChartLegendSortFn
  /**
   * Sort tooltip entries
   */
  chartTooltipSortFn?: ChartTooltipSortFn
  /**
   * A static or dynamic metric threshold to be displayed on a timeseries chart
   */
  threshold?: Record<ExploreAggregations, Threshold[]>
  /**
   * Hide the truncation warning. Used if manually setting a limit
   */
  hideTruncationWarning?: boolean
  /**
   * Show a total metric value in the center of the donut chart.
   * Only applies when type is 'donut'.
   */
  showCenterMetric?: boolean
  /**
   * Scatter plot options, only applies when type is 'scatter'.
   */
  scatter?: ScatterOptions
}

/**
 * Metric display for simple charts
 */
export const simpleChartMetricDisplay = ['hidden', 'single', 'full'] as const

export type SimpleChartMetricDisplay = typeof simpleChartMetricDisplay[number]

export type AlignX = 'left' | 'center' | 'right' | 'between' | 'around' | 'evenly'

/**
 * Simple Chart options
 */
export interface SimpleChartOptions {
  /**
   * Chart type
   */
  type: SimpleChartType
  /**
   * Chart dataset color palette
   */
  chartDatasetColors?: AnalyticsChartColors | string[]
  /**
   * Determines how much detail about the metric (eg: value, info text, etc) is to be shown in the center
   */
  metricDisplay?: SimpleChartMetricDisplay
  /**
   * Determines whether the dataset order will be reversed
   */
  reverseDataset?: boolean
  /**
   * Determines which dataset value will be display as large text
   */
  numerator?: number
  /**
   * Determines number of decimal points to display in SingleValue chart
   */
  decimalPoints?: number
  /**
   * Determines whether to show trend line in chart
   */
  showTrend?: boolean
  /**
   * Determines whether increase is bad for trend line
   */
  increaseIsBad?: boolean
  /**
   * Determines alignment of the chart
   */
  alignX?: AlignX
}

export interface LegendValues {
  [label: string]: LegendValueEntry
}

export interface DonutChartData {
  labels: string[]
  backgroundColor: string[]
  borderColor: string
  borderWidth: number
  hoverBorderColor: string[]
  hoverBorderWidth: number
  data: number[]
  hoverOffset: number
}

export interface DatasetLabel {
  name: string
  id: string
}

export interface TopNTableRecord {
  id: string
  name: string
  deleted: boolean
  dimension: string
  dimensions?: Array<{
    dimension: string
    id: string
    name: string
    deleted: boolean
  }>
  isEmpty?: boolean
}

export interface SparklineDataset {
  color?: string
  /**
   * Must be unique for each dataset
   */
  label: string
  timestamps: number[]
}

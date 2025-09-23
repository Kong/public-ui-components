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
}

export interface AnalyticsDataPoint {
  x: number
  y: number
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
}

/**
 * Metric display for simple charts
 */
export const simpleChartMetricDisplay = ['hidden', 'single', 'full'] as const

export type SimpleChartMetricDisplay = typeof simpleChartMetricDisplay[number]

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
}

export interface LegendValues {
  [label: string]: LegendValueEntry
}

export interface DonutChartData {
  labels: string[]
  backgroundColor: string[]
  borderColor: string[]
  data: number[]
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
}

export interface SparklineDataset {
  color?: string
  /**
   * Must be unique for each dataset
   */
  label: string
  timestamps: number[]
}

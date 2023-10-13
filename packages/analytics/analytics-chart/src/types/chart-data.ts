import type { ChartData, ChartDataset } from 'chart.js'
import type { ChartTypes, ChartMetricDisplay, ChartTypesSimple } from '../enums'

// Chart.js extendend interfaces
export type Dataset = ChartDataset & { rawDimension: string, rawMetric?: string, total?: number, lineTension?: number, fill?: boolean }

export interface KChartData extends ChartData {
  datasets: Dataset[]
  labels?: string[]
  colorMap?: { [label: string]: string }
}

export interface AnalyticsDataPoint {
  x: number,
  y: number,
}

/**
 * Dimension value to color hex code mapping
 * for custom color pallettes
 *
 * Use for deterministic dimension values for example
 * graphing requests by status code over time, dimensions
 * are known ahead of time they will be 2xx, 3xx, 4xx, 5xx
 */
export interface AnalyticsChartColors {
  [dimensionValue: string]: string
}

/**
 * Analytics Chart options
 */
export interface AnalyticsChartOptions {
  /**
   * Chart type
   */
  type: ChartTypes
  /**
   * Are the datasets stacked or not.
   * If stacked, the datasets are stacked on top of each other.
   * Applies to timeseries charts as well as bar charts.
   */
  stacked?: boolean,
  /**
   * Apply fill to datasets.
   * If true, fill the area under the line.
   * Only applies to time series charts.
   */
  fill?: boolean,
  /**
   * Title to display for the metric axis
   * If not provided, show nothing
   */
  metricAxesTitle?: string,
  /**
   * Title to display for the dimension axis
   * If not provided, show nothing
   */
  dimensionAxesTitle?: string,
  /**
   * Chart dataset color palette
   */
  chartDatasetColors?: AnalyticsChartColors | string[],
}

/**
 * Simple Chart options
 */
export interface SimpleChartOptions {
  /**
   * Chart type
   */
  type: ChartTypesSimple
  /**
   * Chart dataset color palette
   */
  chartDatasetColors?: AnalyticsChartColors | string[],
  /**
   * Determines how much detail about the metric (eg: value, info text, etc) is to be shown in the center
   */
  metricDisplay?: ChartMetricDisplay,
  /**
   * Determines whether the dataset order will be reversed
   */
  reverseDataset?: boolean,
  /**
   * Determines metric alignment
   */
  bigNumberKey?: number,
}

export interface LegendValueEntry {
  raw: number,
  formatted: string
}

export interface LegendValues {
  [label: string]: LegendValueEntry
}

export interface DoughnutChartData {
  labels: string[]
  backgroundColor: string[]
  borderColor: string[]
  data: number[]
}

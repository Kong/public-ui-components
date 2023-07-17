import { ChartData, ChartDataset } from 'chart.js'
import { ChartTypes, ChartMetricDisplay, ChartTypesSimple } from '../enums'

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
 * Chart options
 */
export interface AnalyticsChartOptions {
  /**
   * Chart type
   */
  type: ChartTypes | ChartTypesSimple
  /**
   * Are the datasets stacked or not.
   * If stacked, the datasets are stacked on top of each other
   * Only applies to time series line charts.
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
  /**
   *
   */
  metricDisplay?: ChartMetricDisplay,
  /**
   * Determines if a simplified version of the chart should be displayed
   */
  isSimple?: boolean,
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

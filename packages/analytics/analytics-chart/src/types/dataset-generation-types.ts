import type { AnalyticsChartColors } from '../types'

export interface BarChartDatasetGenerationParams {
  metricNames: string[]
  dimensionFieldNames: string[]
  barSegmentLabels: string[]
  pivotRecords: { [k: string]: string | number | null }
  rowLabels: string[]
  colorPalette: string[] | AnalyticsChartColors
  isMultiMetric?: boolean
  hasDimensions?: boolean
}

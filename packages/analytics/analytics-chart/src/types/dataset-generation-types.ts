import type { AnalyticsChartColors, DatasetLabel } from '../types'

export interface BarChartDatasetGenerationParams {
  metricNames: string[]
  dimensionFieldNames: string[]
  barSegmentLabels: DatasetLabel[]
  pivotRecords: { [k: string]: string | number | null }
  rowLabels: DatasetLabel[]
  colorPalette: string[] | AnalyticsChartColors
  isMultiMetric?: boolean
  hasDimensions?: boolean
}

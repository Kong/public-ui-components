import type { AnalyticsChartColors, DatasetLabel } from '../types'

export interface BarChartDatasetGenerationParams {
  metricNames: string[]
  dimensionFieldNames: string[]
  barSegmentLabels: DatasetLabel[]
  pivotRecords: { [k: string]: string | number | null | undefined }
  rowLabels: DatasetLabel[]
  colorPalette?: string[] | AnalyticsChartColors
  seriesDimension?: string
  isMultiMetric?: boolean
  hasDimensions?: boolean
}

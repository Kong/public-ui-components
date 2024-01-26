import type { AnalyticsChartColors } from './chart-data'

/**
 * Interace representing the various options
 * that can be provided to the useExploreResultToTimeddatasets composable
 *
 * borderWidth
 *   - determines the line chart line thickness; defaults to zero
 * fill
 *   - determines if the generated should have the area under the line filled
 * useMetricForColor
 *   - determines if colors should be generated based on the metrics
 *   - if false, colors will be auto generated using the generic datavis palette
 */
export interface ExploreToDatasetDeps {
  borderWidth?: number
  colorPalette?: AnalyticsChartColors | string[]
  fill?: boolean
}

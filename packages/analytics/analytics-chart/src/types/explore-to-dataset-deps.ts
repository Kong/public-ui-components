import { AnalyticsChartColors } from './chart-data'

/**
 * Interace representing the various options
 * that can be provided to the useExploreResultToTimeddatasets composable
 *
 * fill
 *   - determines if the generated should have the area under the line filled
 * useMetricForColor
 *   - determines if colors should be generated based on the metrics
 *   - if false, colors will be auto generated using the generic datavis palette
 */
export interface ExploreToDatasetDeps {
  colorPalette?: AnalyticsChartColors | string[]
  fill?: boolean
}

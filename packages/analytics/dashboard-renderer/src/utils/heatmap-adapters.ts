import type { AnalyticsExploreRecord, Display, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { HeatmapDataPoint } from '@kong-ui-public/echarts'

import { format } from 'date-fns'
import { toMetricValue } from './metric-value'

const DAY_FORMAT = 'MMM dd'

export interface HeatmapChartData {
  /** `[xIndex, yIndex, value]` cells */
  data: HeatmapDataPoint[]
  /** One column per day */
  xAxisLabels: string[]
  /** One row per dimension value, by display name */
  yAxisLabels: string[]
}

const dayLabels = (start: string, end: string): string[] => {
  const labels: string[] = []
  const endDate = new Date(end)

  for (const day = new Date(start); day < endDate; day.setDate(day.getDate() + 1)) {
    labels.push(format(day, DAY_FORMAT))
  }

  return labels
}

const rowIndex = (rowIds: string[], id: string): number => {
  const index = rowIds.indexOf(id)

  return index === -1 ? rowIds.push(id) - 1 : index
}

const rowLabel = (dimensionDisplay: Display, id: string): string => dimensionDisplay[id]?.name ?? id

/**
 * Reduces an explore result over time and one dimension to heatmap cells:
 * a column per day, a row per dimension value, colored by the first metric.
 */
export const exploreResultToHeatmap = (result: ExploreResultV4 | undefined): HeatmapChartData | undefined => {
  if (!result?.meta || !result.data) {
    return undefined
  }

  const { display, metric_names: metricNames, start, end } = result.meta
  const metric = metricNames?.[0]
  const dimension = display && Object.keys(display).find((key) => key !== 'time')

  if (!metric || !dimension || !start || !end) {
    console.error('Cannot build heatmap chart data from this explore result. Missing metric, dimension or time range.')

    return undefined
  }

  const xAxisLabels = dayLabels(start, end)
  const rowIds: string[] = []
  const data: HeatmapDataPoint[] = []

  for (const { timestamp, event } of result.data as AnalyticsExploreRecord[]) {
    const x = xAxisLabels.indexOf(format(new Date(timestamp), DAY_FORMAT))
    const value = toMetricValue(event[metric])

    if (x === -1 || value === undefined) {
      continue
    }

    data.push([x, rowIndex(rowIds, String(event[dimension])), value])
  }

  return { data, xAxisLabels, yAxisLabels: rowIds.map((id) => rowLabel(display[dimension], id)) }
}

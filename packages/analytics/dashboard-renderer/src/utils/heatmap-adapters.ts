import type { AnalyticsExploreRecord, Display, ExploreResultV4, GranularityValues } from '@kong-ui-public/analytics-utilities'
import type { HeatmapDataPoint } from '@kong-ui-public/echarts'

import { formatChartTicksByGranularity } from '@kong-ui-public/analytics-chart'
import { Granularities, msToGranularity } from '@kong-ui-public/analytics-utilities'
import { formatInTimeZone } from 'date-fns-tz'
import { toMetricValue } from './metric-value'

export interface HeatmapChartData {
  /** `[xIndex, yIndex, value]` cells */
  data: HeatmapDataPoint[]
  /** One column per time interval at the result's granularity */
  xAxisLabels: string[]
  /** One row per dimension value, by display name */
  yAxisLabels: string[]
}

export interface HeatmapAdapterOptions {
  tz?: string
}

const firstColumnMs = (startMs: number, granularityMs: number, timestamps: number[]): number => {
  if (!timestamps.length) {
    return startMs
  }

  const earliest = timestamps.reduce((min, ts) => Math.min(min, ts))

  if (earliest <= startMs) {
    return earliest
  }

  const columnsAfterStart = Math.ceil((earliest - startMs) / granularityMs)

  return earliest - columnsAfterStart * granularityMs
}

const columnTimestamps = (firstMs: number, endMs: number, granularityMs: number): number[] => {
  const columns: number[] = []

  for (let ts = firstMs; ts < endMs; ts += granularityMs) {
    columns.push(ts)
  }

  return columns
}

const columnLabels = (columns: number[], granularity: GranularityValues, tz: string): string[] => {
  const dayKey = (ts: number) => formatInTimeZone(ts, tz, 'yyyy-MM-dd')
  // Like the timeseries charts, add the date to time labels only when the range spans days
  const dayBoundaryCrossed = columns.length > 0 && dayKey(columns[0]) !== dayKey(columns[columns.length - 1])

  return columns.map((ts) => formatChartTicksByGranularity({ tickValue: new Date(ts), granularity, dayBoundaryCrossed, timezone: tz }))
}

const rowIndex = (rowIds: string[], id: string): number => {
  const index = rowIds.indexOf(id)

  return index === -1 ? rowIds.push(id) - 1 : index
}

const rowLabel = (dimensionDisplay: Display, id: string): string => dimensionDisplay[id]?.name ?? id

/**
 * Reduces an explore result over time and one dimension to heatmap cells:
 * a column per time interval, a row per dimension value, colored by the first metric.
 */
export const exploreResultToHeatmap = (result: ExploreResultV4 | undefined, { tz }: HeatmapAdapterOptions = {}): HeatmapChartData | undefined => {
  if (!result?.meta || !result.data) {
    return undefined
  }

  const { display, metric_names: metricNames, start, end, granularity_ms: resultGranularityMs } = result.meta
  const metric = metricNames?.[0]
  const dimension = display && Object.keys(display).find((key) => key !== 'time')

  if (!metric || !dimension || !start || !end) {
    console.error('Cannot build heatmap chart data from this explore result. Missing metric, dimension or time range.')

    return undefined
  }

  // Fall back to daily
  const granularityMs = resultGranularityMs || Granularities.daily
  const granularity = msToGranularity(granularityMs) ?? 'daily'
  const timezone = tz || Intl.DateTimeFormat().resolvedOptions().timeZone

  const records = result.data as AnalyticsExploreRecord[]
  const firstMs = firstColumnMs(new Date(start).getTime(), granularityMs, records.map(({ timestamp }) => new Date(timestamp).getTime()))
  const columns = columnTimestamps(firstMs, new Date(end).getTime(), granularityMs)
  const rowIds: string[] = []
  const data: HeatmapDataPoint[] = []

  for (const { timestamp, event } of records) {
    const x = Math.floor((new Date(timestamp).getTime() - firstMs) / granularityMs)
    const value = toMetricValue(event[metric])

    if (x < 0 || x >= columns.length || value === undefined) {
      continue
    }

    data.push([x, rowIndex(rowIds, String(event[dimension])), value])
  }

  return { data, xAxisLabels: columnLabels(columns, granularity, timezone), yAxisLabels: rowIds.map((id) => rowLabel(display[dimension], id)) }
}

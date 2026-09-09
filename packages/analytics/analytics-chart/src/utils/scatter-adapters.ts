import type { AnalyticsExploreRecord, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { ScatterChartData, ScatterDataPoint } from '../types'

const EMPTY_GROUP = 'empty'

/**
 * Reduces an explore result to scatter input, plotting one point per record.
 *
 * Only the first metric and the first dimension are used... for now.
 */
export const exploreResultToScatterData = (result: ExploreResultV4 | undefined): ScatterChartData | undefined => {
  if (!result || !('meta' in result) || !('data' in result)) {
    return undefined
  }

  const {
    display,
    metric_names: metricNames,
    metric_units: metricUnits,
    start,
    end,
    truncated,
    limit,
    datasource,
  } = result.meta

  if (!metricNames?.length) {
    console.error('Cannot build scatter chart data from this explore result. Missing metric names.')

    return undefined
  }

  const metric = metricNames[0]
  const dimension = (display && Object.keys(display)[0]) || undefined
  const records = (result.data ?? []) as AnalyticsExploreRecord[]

  const points: ScatterDataPoint[] = []

  for (const record of records) {
    const point = toPoint(record.timestamp, record.event[metric], dimension ? record.event[dimension] : undefined)

    if (point) {
      points.push(point)
    }
  }

  return {
    points,
    metric,
    metricUnit: metricUnits?.[metric],
    dimension,
    display: dimension ? display?.[dimension] : undefined,
    start,
    end,
    truncated,
    limit,
    datasource,
  }
}

/**
 * Builds a point, or doesn't.
 *
 * Since `null` would read as 0, this would cause a `0` point on the axis bringing
 * down the percentile with it, so these are just dropped entirely.
 */
const toPoint = (rawTimestamp: unknown, rawValue: unknown, rawGroup: unknown): ScatterDataPoint | undefined => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return undefined
  }

  const timestamp = new Date(rawTimestamp as string | number).valueOf()
  const value = Number(rawValue)

  if (!Number.isFinite(timestamp) || !Number.isFinite(value)) {
    return undefined
  }

  if (rawGroup === undefined) {
    return { timestamp, value }
  }

  // A dimension that has no value is part of the "empty" group
  const hasGroupValue = rawGroup !== null && rawGroup !== ''

  return {
    timestamp,
    value,
    group: hasGroupValue ? String(rawGroup) : EMPTY_GROUP,
  }
}

import type {
  AnalyticsExploreRecord,
  Display,
  ExploreResultV4,
  FetchAllRequestsResult,
  RequestRecord,
} from '@kong-ui-public/analytics-utilities'
import type { ScatterChartData, ScatterDataPoint, ScatterPointExtra } from '../types'

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
const toPoint = (
  rawTimestamp: unknown,
  rawValue: unknown,
  rawGroup: unknown,
  extras?: ScatterPointExtra[],
): ScatterDataPoint | undefined => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return undefined
  }

  const timestamp = new Date(rawTimestamp as string | number).valueOf()
  const value = Number(rawValue)

  if (!Number.isFinite(timestamp) || !Number.isFinite(value)) {
    return undefined
  }

  const withExtras = extras?.length ? { extras } : {}

  if (rawGroup === undefined) {
    return { timestamp, value, ...withExtras }
  }

  // A dimension that has no value is part of the "empty" group
  const hasGroupValue = rawGroup !== null && rawGroup !== ''

  return {
    timestamp,
    value,
    group: hasGroupValue ? String(rawGroup) : EMPTY_GROUP,
    ...withExtras,
  }
}

const readExtras = (
  source: unknown,
  record: RequestRecord,
  extraFields?: ScatterExtraField[],
): ScatterPointExtra[] | undefined => {
  if (!extraFields?.length) {
    return undefined
  }

  const extras: ScatterPointExtra[] = []

  for (const { field, label, unit } of extraFields) {
    const value = readPath(source, field) ?? readPath(record, field)

    if (value === null || value === undefined || value === '') {
      continue
    }

    extras.push({
      label: label ?? field,
      value: value as string | number,
      ...(unit ? { unit } : {}),
    })
  }

  return extras.length ? extras : undefined
}

export interface ScatterExtraField {
  field: string
  label?: string
  unit?: string
}

export interface RequestsToScatterDataOptions {
  metric: string
  dimension?: string
  /** A nested object to expand into one point per entry. */
  unroll?: string
  timestamp?: string
  display?: Display
  extraFields?: ScatterExtraField[]
  metricUnit?: string
}

export const requestsToScatterData = (
  result: FetchAllRequestsResult | undefined,
  options: RequestsToScatterDataOptions,
): ScatterChartData | undefined => {
  if (!result || !('meta' in result)) {
    return undefined
  }

  const { metric, dimension, unroll, display, extraFields, metricUnit } = options
  const timestampField = options.timestamp ?? 'request_start'

  if (!metric) {
    console.error('Cannot build scatter chart data from these request records. Missing metric.')

    return undefined
  }

  const points: ScatterDataPoint[] = []

  for (const record of result.results ?? []) {
    const timestamp = readPath(record, timestampField)

    for (const source of unrolledSources(record, unroll)) {
      const rawValue = readPath(source, metric) ?? readPath(record, metric)
      const rawGroup = dimension ? readPath(source, dimension) ?? readPath(record, dimension) : undefined

      const point = toPoint(
        timestamp,
        rawValue,
        dimension ? rawGroup ?? null : undefined,
        readExtras(source, record, extraFields),
      )

      if (point) {
        points.push(point)
      }
    }
  }

  return {
    points,
    metric,
    metricUnit,
    dimension,
    display,
    start: result.meta?.time_range?.start,
    end: result.meta?.time_range?.end,
    truncated: result.truncated,
    limit: result.limit,
    datasource: 'requests',
  }
}

const unrolledSources = (record: RequestRecord, unroll?: string): unknown[] => {
  if (!unroll) {
    return [record]
  }

  const entries = readPath(record, unroll)

  return Array.isArray(entries) ? entries : []
}

const readPath = (source: unknown, path: string): unknown => {
  let current = source

  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[key]
  }

  return current
}

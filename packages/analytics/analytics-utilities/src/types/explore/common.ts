
export const exploreFilterTypesV2 = ['in', 'not_in', 'selector'] as const

export type ExploreFilterTypesV2 = typeof exploreFilterTypesV2[number]

export const exploreMetricFilterTypesV2 = ['=', '!=', '<', '>', '<=', '>='] as const

export type ExploreMetricFilterTypesV2 = typeof exploreMetricFilterTypesV2[number]


// Note: time types are common to all of the datasources.
// If a datasource doesn't support a certain time range / time spec, it returns no records
// rather than failing.
// If a datasource doesn't support a certain granularity, it rounds to the nearest granularity it does support.

export const timeRangeTypeV2 = ['absolute', 'relative'] as const

export type TimeRangeTypeV2 = typeof timeRangeTypeV2[number]


export interface AbsoluteTimeRangeV4 {
  type: 'absolute'
  tz?: string
  start: Date
  end: Date
}

export const relativeTimeRangeValuesV4 = [
  '15m',
  '1h',
  '6h',
  '12h',
  '24h',
  '7d',
  'current_week',
  'previous_week',
  '30d',
  'current_month',
  'previous_month',
] as const

export type RelativeTimeRangeValuesV4 = typeof relativeTimeRangeValuesV4[number]

export interface RelativeTimeRangeV4 {
  type: 'relative'
  tz?: string
  time_range: RelativeTimeRangeValuesV4
}

export type TimeRangeV4 = AbsoluteTimeRangeV4 | RelativeTimeRangeV4

export const granularityValues = [
  'secondly',
  'minutely',
  'hourly',
  'daily',
  'weekly',
  'trend',
] as const

export type GranularityValues = typeof granularityValues[number]

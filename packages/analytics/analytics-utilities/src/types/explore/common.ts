
export const exploreFilterTypesV2 = ['in', 'not_in', 'selector'] as const

export type ExploreFilterTypesV2 = typeof exploreFilterTypesV2[number]

export const requestFilterTypeEqualsV2 = ['=', '!='] as const

export type RequestFilterTypeEqualsV2 = typeof requestFilterTypeEqualsV2[number]

export const requestFilterTypeMetricV2 = ['=', '!=', '<', '>', '<=', '>='] as const

export type RequestFilterTypeMetricV2 = typeof requestFilterTypeMetricV2[number]

export const requestFilterTypeEmptyV2 = ['empty', 'not_empty'] as const

export type RequestFilterTypeEmptyV2 = typeof requestFilterTypeEmptyV2[number]

export const requestFilterTypeWildcardV2 = ['starts_with', 'ends_with'] as const

export type RequestFilterTypeWildcardV2 = typeof requestFilterTypeWildcardV2[number]


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
  '90d',
  '180d',
  '360d',
  'current_year',
  'previous_year',
] as const

export type RelativeTimeRangeValuesV4 = typeof relativeTimeRangeValuesV4[number]

export interface RelativeTimeRangeV4 {
  type: 'relative'
  tz?: string
  time_range: RelativeTimeRangeValuesV4
}

export type TimeRangeV4 = AbsoluteTimeRangeV4 | RelativeTimeRangeV4

export interface TimeRangeMetaResponse {
  start: string
  end: string
  min_granularity_ms: number
}

export const granularityValues = [
  'secondly',
  'tenSecondly',
  'thirtySecondly',
  'minutely',
  'fiveMinutely',
  'tenMinutely',
  'thirtyMinutely',
  'hourly',
  'twoHourly',
  'twelveHourly',
  'daily',
  'weekly',
  'trend',
] as const

export type GranularityValues = typeof granularityValues[number]

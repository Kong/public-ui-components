// Query types
import type { MetricUnit, RecordEvent } from './analytics-data'

export const exploreFilterTypesV2 = ['in', 'not_in', 'selector'] as const

export type ExploreFilterTypesV2 = typeof exploreFilterTypesV2[number]

export const queryableExploreDimensions = [
  'api_product',
  'api_product_version',
  'application',
  'consumer',
  'control_plane',
  'control_plane_group',
  'data_plane_node',
  'gateway_service',
  'route',
  'status_code',
  'status_code_grouped',
  'time',
] as const

export type QueryableExploreDimensions = typeof queryableExploreDimensions[number]

export interface ExploreFilter {
  type: ExploreFilterTypesV2
  dimension: QueryableExploreDimensions
  values: (string | number)[]
}

export const exploreAggregations = [
  'request_count',
  'request_per_minute',
  'response_latency_p99',
  'response_latency_p95',
  'response_latency_p50',
  'response_latency_average',
  'upstream_latency_p99',
  'upstream_latency_p95',
  'upstream_latency_p50',
  'upstream_latency_average',
  'kong_latency_p99',
  'kong_latency_p95',
  'kong_latency_p50',
  'kong_latency_average',
  'response_size_p99',
  'response_size_p95',
  'response_size_p50',
  'request_size_p99',
  'request_size_p95',
  'request_size_p50',
  'request_size_average',
  'response_size_average',
] as const

export type ExploreAggregations = typeof exploreAggregations[number]

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
  '30d',
  'current_week',
  'current_month',
  'previous_week',
  'previous_month',
] as const

export type RelativeTimeRangeValuesV4 = typeof relativeTimeRangeValuesV4[number]

export interface RelativeTimeRangeV4 {
  type: 'relative'
  tz?: string
  time_range: RelativeTimeRangeValuesV4
}

export type TimeRangeV4 = AbsoluteTimeRangeV4 | RelativeTimeRangeV4

export interface ExploreQuery {
  metrics?: ExploreAggregations[]
  dimensions?: QueryableExploreDimensions[]
  filters?: ExploreFilter[]
  granularity_ms?: number
  time_range: TimeRangeV4
  limit?: number
  descending?: boolean
  meta?: {
    query_id: string
  }
}

// Result types
export interface Display {
  [id: string]: {
    name: string
    deleted?: boolean
    is_other_group?: boolean
  }
}

export interface DisplayBlob {
  [dimension: string]: Display
}

export interface QueryResponseMeta {
  start_ms: number
  end_ms: number
  display: DisplayBlob
  metric_names?: ExploreAggregations[]
  metric_units?: MetricUnit
  granularity?: number
  granularity_ms?: number
  truncated?: boolean
  limit?: number
  query_id: string
}

export interface GroupByResult {
  version?: string
  timestamp: string
  event: RecordEvent
}

export interface ExploreResultV4 {
  data: GroupByResult[]
  meta: QueryResponseMeta
}

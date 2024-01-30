// Query types
import type { MetricUnit, RecordEvent } from './analytics-data'

export enum ExploreFilterTypesV2 {
  in = 'in',
  not_in = 'not_in',
  selector = 'selector',
}

export enum QueryableExploreDimensions {
  api_product = 'api_product',
  api_product_version = 'api_product_version',
  application = 'application',
  consumer = 'consumer',
  control_plane = 'control_plane',
  control_plane_group = 'control_plane_group',
  data_plane_node = 'data_plane_node',
  gateway_service = 'gateway_service',
  route = 'route',
  status_code = 'status_code',
  status_code_grouped = 'status_code_grouped',
  time = 'time',
}

export interface ExploreFilter {
  type: ExploreFilterTypesV2
  dimension: QueryableExploreDimensions
  values: (string | number)[]
}

export enum ExploreAggregations {
  request_count = 'request_count',
  request_per_minute = 'request_per_minute',
  response_latency_p99 = 'response_latency_p99',
  response_latency_p95 = 'response_latency_p95',
  response_latency_p50 = 'response_latency_p50',
  response_latency_average = 'response_latency_average',
  upstream_latency_p99 = 'upstream_latency_p99',
  upstream_latency_p95 = 'upstream_latency_p95',
  upstream_latency_p50 = 'upstream_latency_p50',
  upstream_latency_average = 'upstream_latency_average',
  kong_latency_p99 = 'kong_latency_p99',
  kong_latency_p95 = 'kong_latency_p95',
  kong_latency_p50 = 'kong_latency_p50',
  kong_latency_average = 'kong_latency_average',
  response_size_p99 = 'response_size_p99',
  response_size_p95 = 'response_size_p95',
  response_size_p50 = 'response_size_p50',
  request_size_p99 = 'request_size_p99',
  request_size_p95 = 'request_size_p95',
  request_size_p50 = 'request_size_p50',
  request_size_average = 'request_size_average',
  response_size_average = 'response_size_average',
}

export enum TimeRangeTypeV2 {
  absolute = 'absolute',
  relative = 'relative',
}

export interface AbsoluteTimeRangeV4 {
  type: TimeRangeTypeV2.absolute
  tz?: string
  start?: Date
  end?: Date
}

export enum RelativeTimeRangeValuesV4 {
  fifteen_min = '15m',
  one_hour = '1h',
  six_hour = '6h',
  twelve_hour = '12h',
  one_day = '24h',
  seven_day = '7d',
  thirty_day = '30d',
  current_week = 'current_week',
  current_month = 'current_month',
  previous_week = 'previous_week',
  previous_month = 'previous_month',
}

export interface RelativeTimeRangeV4 {
  type: TimeRangeTypeV2.relative
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
    deleted: boolean
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

// Query types
import type { MetricUnit, RecordEvent } from './analytics-data'

export const queryDatasources = ['basic', 'advanced', 'ai'] as const

export type QueryDatasource = typeof queryDatasources[number]

export const exploreFilterTypesV2 = ['in', 'not_in', 'selector'] as const

export type ExploreFilterTypesV2 = typeof exploreFilterTypesV2[number]

export const queryableBasicExploreDimensions = [
  'api_product',
  'api_product_version',
  'control_plane',
  'control_plane_group',
  'data_plane_node',
  'gateway_service',
  'route',
  'status_code',
  'status_code_grouped',
  'time',
] as const

export type QueryableBasicExploreDimensions = typeof queryableBasicExploreDimensions[number]

export const queryableAiExploreDimensions = [
  'control_plane',
  'control_plane_group',
  'gateway_service',
  'consumer',
  'application',
  'route',
  'ai_provider',
  'ai_response_model',
  'ai_request_model',
  'time',
] as const

export type QueryableAiExploreDimensions = typeof queryableAiExploreDimensions[number]

export const queryableExploreDimensions = [
  ...queryableBasicExploreDimensions,
  'application',
  'consumer',
  'iso_code',
] as const

export type QueryableExploreDimensions = typeof queryableExploreDimensions[number]

export interface BasicExploreFilter {
  type: ExploreFilterTypesV2
  dimension: QueryableExploreDimensions
  values: (string | number | null)[]
}

export interface ExploreFilter extends Omit<BasicExploreFilter, 'dimension'> {
  dimension: QueryableExploreDimensions
}

export interface AiExploreFilter extends Omit<BasicExploreFilter, 'dimension'> {
  dimension: QueryableAiExploreDimensions
}

export const basicExploreAggregations = [
  'active_services',
  'request_count',
  'request_per_minute',
  'response_latency_average',
] as const

export type BasicExploreAggregations = typeof basicExploreAggregations[number]

export const aiExploreAggregations = [
  'total_tokens',
  'prompt_tokens',
  'completion_tokens',
  'ai_request_count',
  'cost',
] as const

export type AiExploreAggregations = typeof aiExploreAggregations[number]

export const exploreAggregations = [
  ...basicExploreAggregations,
  'response_latency_p99',
  'response_latency_p95',
  'response_latency_p50',
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

export type AllAggregations = BasicExploreAggregations | AiExploreAggregations | ExploreAggregations

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

export interface BasicExploreQuery {
  metrics?: BasicExploreAggregations[]
  dimensions?: QueryableBasicExploreDimensions[]
  filters?: BasicExploreFilter[]
  granularity?: GranularityValues
  time_range?: TimeRangeV4
  limit?: number
  descending?: boolean
  short_name?: boolean
  meta?: {
    query_id: string
  }
}

export interface AiExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: AiExploreAggregations[]
  dimensions?: QueryableAiExploreDimensions[]
  filters?: AiExploreFilter[]
}

export interface ExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: ExploreAggregations[]
  dimensions?: QueryableExploreDimensions[]
  filters?: ExploreFilter[]
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
  metric_names?: AllAggregations[]
  metric_units?: MetricUnit
  granularity_ms: number
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

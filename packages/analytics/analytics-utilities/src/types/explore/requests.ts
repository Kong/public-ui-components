import { makeFilterable } from './util'
import type { AbsoluteTimeRangeV4, ExploreFilterTypesV2, RequestFilterTypeEmptyV2, RequestFilterTypeEqualsV2, RequestFilterTypeMetricV2, RequestFilterTypeWildcardV2 } from './common'
import { type ExploreFilter } from './advanced'

// status_code and upstream_status_code are treated as metric filters
export const queryableRequestDimensions = [
  'api_product',
  'api_product_version',
  'application',
  'auth_type',
  'client_ip',
  'consumer',
  'consumer_group',
  'control_plane',
  'control_plane_group',
  'country_code',
  'data_plane_node',
  'gateway_service',
  'header_host',
  'header_user_agent',
  'http_method',
  'iso_code',
  'request_id',
  'request_uri',
  'response_header_content_type',
  'response_source',
  'route',
  'service_port',
  'service_protocol',
  'sse',
  'status_code',
  'status_code_grouped',
  'time',
  'upstream_uri',
  'upstream_status_code',
  'upstream_status_code_grouped',
  'websocket',
] as const

export type QueryableRequestDimensions = typeof queryableRequestDimensions[number]

// These are dimensions that can be fetched/searched via KSearch/KAnalytics/KHCP
export const fetchableRequestDimensions = [
  'api_product',
  'api_product_version',
  'application',
  'consumer',
  'consumer_group',
  'control_plane',
  'control_plane_group',
  'data_plane_node',
  'gateway_service',
  'route',
] as const satisfies QueryableRequestDimensions[]

export type FetchableRequestDimensions = typeof fetchableRequestDimensions[number]

// These are dimensions that can be searched locally (i.e. in-memory) in the frontend
// Will have a pre-populated list that can be searched from defined in the host app
export const searchableLocalRequestDimensions = [
  'auth_type',
  'country_code',
  'iso_code',
  'status_code',
  'upstream_status_code',
  'status_code_grouped',
  'upstream_status_code_grouped',
  'http_method',
  'service_protocol',
] as const satisfies QueryableRequestDimensions[]

export type SearchableLocalRequestDimensions = typeof searchableLocalRequestDimensions[number]

export const textBasedRequestDimensions = [
  'client_ip',
  'header_host',
  'header_user_agent',
  'request_id',
  'request_uri',
  'response_header_content_type',
  'response_source',
  'service_port',
  'service_protocol',
  'sse',
  'time',
  'upstream_uri',
  'websocket',
] as const satisfies QueryableRequestDimensions[]

export type TextBasedRequestDimensions = typeof textBasedRequestDimensions[number]

export const filterableFetchableRequestDimensions = makeFilterable(fetchableRequestDimensions)

export type FilterableFetchableRequestDimensions = typeof filterableFetchableRequestDimensions[number]

export const filterableSearchableLocalRequestDimensions = makeFilterable(searchableLocalRequestDimensions)

export type FilterableSearchableLocalRequestDimensions = typeof filterableSearchableLocalRequestDimensions[number]

export const filterableTextBasedRequestDimensions = makeFilterable(textBasedRequestDimensions)

export type FilterableTextBasedRequestDimensions = typeof filterableTextBasedRequestDimensions[number]

export const queryableRequestWildcardDimensions = [
  'request_uri',
  'upstream_uri',
] as const

export type QueryableRequestWildcardDimensions = typeof queryableRequestWildcardDimensions[number]

export const filterableRequestWildcardDimensions = queryableRequestWildcardDimensions

export type FilterableRequestWildcardDimensions = typeof filterableRequestWildcardDimensions[number]

export const queryableRequestMetrics = [
  'ai_count',
  'latencies_response_ms',
  'latencies_upstream_ms',
  'latencies_kong_gateway_ms',
  'response_body_size',
  'request_body_size',
  'status_code',
  'upstream_status_code',
] as const

export type QueryableRequestMetrics = typeof queryableRequestMetrics[number]

export const filterableRequestMetrics = makeFilterable(queryableRequestMetrics)

export type FilterableRequestMetrics = typeof filterableRequestMetrics[number]

export interface RequestInFilter {
  operator: ExploreFilterTypesV2
  field: FilterableFetchableRequestDimensions | FilterableSearchableLocalRequestDimensions | FilterableTextBasedRequestDimensions | FilterableRequestWildcardDimensions | FilterableRequestMetrics
  value: (string | number)[]
}
export interface RequestEqualsFilter {
  operator: RequestFilterTypeEqualsV2
  field: FilterableFetchableRequestDimensions | FilterableSearchableLocalRequestDimensions | FilterableTextBasedRequestDimensions | FilterableRequestWildcardDimensions
  value: string
}
export interface RequestMetricFilter {
  operator: RequestFilterTypeMetricV2
  field: FilterableRequestMetrics
  value: number
}
export interface RequestEmptyFilter {
  operator: RequestFilterTypeEmptyV2
  field: FilterableFetchableRequestDimensions | FilterableSearchableLocalRequestDimensions | FilterableTextBasedRequestDimensions | FilterableRequestWildcardDimensions | FilterableRequestMetrics
}
export interface RequestWildcardFilter {
  operator: RequestFilterTypeWildcardV2
  field: FilterableRequestWildcardDimensions
  value: string
}

export type RequestFilter = ExploreFilter |
  RequestInFilter |
  RequestEqualsFilter |
  RequestMetricFilter |
  RequestEmptyFilter |
  RequestWildcardFilter

export const relativeTimeRangeValuesRequestV2 = [
  '15M',
  '1H',
  '6H',
  '12H',
  '24H',
  '7D',
] as const

export type RelativeTimeRangeValuesRequestV2 = typeof relativeTimeRangeValuesRequestV2[number]

export interface RelativeTimeRangeRequestV2 {
  type: 'relative'
  tz?: string
  time_range: RelativeTimeRangeValuesRequestV2
}

export type TimeRangeRequestV2 = AbsoluteTimeRangeV4 | RelativeTimeRangeRequestV2

export interface RequestQuery {
  filters: RequestFilter[]
  time_range: TimeRangeRequestV2
  order?: string
  offset?: number
  size?: number
  query_id?: string
  limit?: number
  classified?: boolean
}

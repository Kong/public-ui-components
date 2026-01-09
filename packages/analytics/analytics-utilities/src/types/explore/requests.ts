import { makeFilterable } from './util'
import type { AbsoluteTimeRangeV4, ExploreFilterTypesV2, RequestFilterTypeEmptyV2, RequestFilterTypeEqualsV2, RequestFilterTypeMetricV2, RequestFilterTypeWildcardV2 } from './common'

// status_code and upstream_status_code are treated as metric filters
export const queryableRequestDimensions = [
  'api',
  'api_package',
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
  'data_plane_node_version',
  'gateway_service',
  'header_host',
  'header_user_agent',
  'http_method',
  'portal',
  'realm',
  'request_id',
  'request_uri',
  'response_header_content_type',
  'response_source',
  'route',
  'service_port',
  'service_protocol',
  'sse',
  'status_code_grouped',
  'time',
  'trace_id',
  'upstream_uri',
  'upstream_status_code_grouped',
  'websocket',
] as const

export type QueryableRequestDimensions = typeof queryableRequestDimensions[number]

export const filterableRequestDimensions = makeFilterable(queryableRequestDimensions)

export type FilterableRequestDimensions = typeof filterableRequestDimensions[number]

export const queryableRequestWildcardDimensions = [
  'auth_type',
  'client_ip',
  'data_plane_node_version',
  'header_host',
  'header_user_agent',
  'http_method',
  'request_id',
  'request_uri',
  'response_header_content_type',
  'response_source',
  'service_port',
  'service_protocol',
  'trace_id',
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
  'request_body_size',
  'response_body_size',
  'response_header_content_length',
  'status_code',
  'upstream_status_code',
] as const

export type QueryableRequestMetrics = typeof queryableRequestMetrics[number]

export const filterableRequestMetrics = makeFilterable(queryableRequestMetrics)

export type FilterableRequestMetrics = typeof filterableRequestMetrics[number]

export interface RequestInFilter {
  operator: ExploreFilterTypesV2
  field: FilterableRequestDimensions | FilterableRequestWildcardDimensions | FilterableRequestMetrics
  value: Array<string | number>
}
export interface RequestEqualsFilter {
  operator: RequestFilterTypeEqualsV2
  field: FilterableRequestDimensions | FilterableRequestWildcardDimensions
  value: string
}
export interface RequestMetricFilter {
  operator: RequestFilterTypeMetricV2
  field: FilterableRequestMetrics
  value: number
}
export interface RequestEmptyFilter {
  operator: RequestFilterTypeEmptyV2
  field: FilterableRequestDimensions | FilterableRequestWildcardDimensions | FilterableRequestMetrics
}
export interface RequestWildcardFilter {
  operator: RequestFilterTypeWildcardV2
  field: FilterableRequestWildcardDimensions
  value: string
}

export type RequestFilter = RequestInFilter |
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
  cursor?: string
}

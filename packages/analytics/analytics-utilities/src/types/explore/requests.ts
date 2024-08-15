import { makeFilterable } from './util'
import type { AbsoluteTimeRangeV4, MetricFilterTypesV2 } from './common'
import { queryableExploreDimensions, type ExploreFilter } from './advanced'

export const queryableRequestDimensions = [
  ...queryableExploreDimensions,
  'auth_type',
  'client_ip',
  'consumer_group',
  'country_code',
  'header_host',
  'header_user_agent',
  'http_method',
  'response_header_content_type',
  'request_id',
  'request_uri',
  'service_port',
  'service_protocol',
  'upstream_status_code',
  'upstream_status_code_grouped',
  'upstream_uri',
] as const

export type QueryableRequestDimensions = typeof queryableRequestDimensions[number]

export const filterableRequestDimensions = makeFilterable(queryableRequestDimensions)

export type FilterableRequestDimensions = typeof filterableRequestDimensions[number]

export const queryableRequestMetrics = [
  'latencies_response_ms',
  'latencies_upstream_ms',
  'latencies_kong_gateway_ms',
  'response_body_size',
  'request_body_size',
] as const

export type QueryableRequestMetrics = typeof queryableRequestMetrics[number]

export const filterableRequestMetrics = makeFilterable(queryableRequestMetrics)

export type FilterableRequestMetrics = typeof filterableRequestMetrics[number]

export interface RequestDimensionFilter extends Omit<ExploreFilter, 'dimension'> {
  dimension?: FilterableRequestDimensions
  field?: FilterableRequestDimensions
}

export interface RequestMetricFilter {
  type: MetricFilterTypesV2
  field: FilterableRequestDimensions
  value: number | null
}

export type RequestFilter = RequestDimensionFilter | RequestMetricFilter

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

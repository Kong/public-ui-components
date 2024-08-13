import { makeFilterable } from './util'
import type { FilterTypesV2, MetricFilterTypesV2, TimeRangeV4 } from './common'
import { queryableExploreDimensions } from './advanced'

export const queryableRequestDimensions = [
  ...queryableExploreDimensions,
  'auth_type',
  'client_ip',
  'consumer_group',
  'header_host',
  'header_user_agent',
  'http_method',
  'iso_country_code',
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

export interface RequestFilter {
  type: FilterTypesV2 | MetricFilterTypesV2
  dimension?: FilterableRequestDimensions | FilterableRequestMetrics
  field?: FilterableRequestDimensions | FilterableRequestMetrics
  value?: number | null
  values?: (string | number | null)[]
}

export interface RequestQuery {
  filters?: RequestFilter[]
  time_range?: TimeRangeV4
  order?: string
  offset?: number
  size?: number
  query_id?: string
  limit?: number
  clasified?: boolean
}

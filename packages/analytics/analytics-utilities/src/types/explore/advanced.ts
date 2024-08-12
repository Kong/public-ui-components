import { makeFilterable } from './util'
import type { BasicExploreFilter, BasicExploreQuery } from './basic'
import { basicExploreAggregations, queryableBasicExploreDimensions } from './basic'
import type { ExploreFilterTypesV2, ExploreMetricFilterTypesV2 } from './common'

export const queryableExploreDimensions = [
  ...queryableBasicExploreDimensions,
  'application',
  'auth_type',
  'client_ip',
  'consumer',
  'consumer_group',
  'header_host',
  'header_user_agent',
  'http_method',
  'iso_code',
  'request_id',
  'request_uri',
  'service_port',
  'service_protocol',
  'upstream_status_code',
  'upstream_status_code_grouped',
  'upstream_uri',
] as const

export type QueryableExploreDimensions = typeof queryableExploreDimensions[number]

export const filterableExploreDimensions = makeFilterable(queryableExploreDimensions)

export type FilterableExploreDimensions = typeof filterableExploreDimensions[number]

export const queryableExploreMetrics = [
  'latencies_response_ms',
  'latencies_upstream_ms',
  'latencies_kong_gateway_ms',
  'response_body_size',
  'request_body_size',
] as const

export type QueryableExploreMetrics = typeof queryableExploreMetrics[number]

export const filterableExploreMetrics = makeFilterable(queryableExploreDimensions)

export type FilterableExploreMetrics = typeof filterableExploreMetrics[number]

export interface ExploreFilter extends Omit<BasicExploreFilter, 'type' | 'dimension' | 'field'> {
  type: ExploreFilterTypesV2 | ExploreMetricFilterTypesV2
  dimension?: FilterableExploreDimensions | FilterableExploreMetrics
  field?: FilterableExploreDimensions | FilterableExploreMetrics
  value?: number | null
}

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

export interface ExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: ExploreAggregations[]
  dimensions?: QueryableExploreDimensions[]
  filters?: ExploreFilter[]
}

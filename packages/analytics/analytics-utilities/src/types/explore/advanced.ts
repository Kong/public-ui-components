import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'
import { basicExploreAggregations, queryableBasicExploreDimensions } from './basic'

export const queryableExploreDimensions = [
  ...queryableBasicExploreDimensions,
  'application',
  'consumer',
  'country_code',
  'upstream_status_code',
  'upstream_status_code_grouped',
  'response_source',
  'data_plane_node_version',
  'realm',
  'portal_api',
  'mcp_info',
  'mcp_session_id',
  'mcp_method',
  'mcp_tool_name',
  'mcp_error',
] as const

export type QueryableExploreDimensions = typeof queryableExploreDimensions[number]

export const filterableExploreDimensions = makeFilterable(queryableExploreDimensions)

export type FilterableExploreDimensions = typeof filterableExploreDimensions[number]

export interface ExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
  field: FilterableExploreDimensions
}

export interface ExploreEmptyFilterV2 extends Omit<BasicExploreEmptyFilterV2, 'field'> {
  field: FilterableExploreDimensions
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
  'response_size_average',
  'response_size_sum',
  'request_size_p99',
  'request_size_p95',
  'request_size_p50',
  'request_size_average',
  'request_size_sum',
  'mcp_response_body_size_sum',
  'mcp_latency_average',
] as const

export type ExploreAggregations = typeof exploreAggregations[number]

export type ExploreFilterAll = ExploreInFilterV2 | ExploreEmptyFilterV2

export interface ExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: ExploreAggregations[]
  dimensions?: QueryableExploreDimensions[]
  filters?: ExploreFilterAll[]
}

import { makeFilterable } from './util'
import type { BasicExploreFilter, BasicExploreInFilterV2, BasicExploreQuery } from './basic'
import { basicExploreAggregations, queryableBasicExploreDimensions } from './basic'

export const queryableExploreDimensions = [
  ...queryableBasicExploreDimensions,
  'application',
  'consumer',
  'iso_code',
] as const

export type QueryableExploreDimensions = typeof queryableExploreDimensions[number]

export const filterableExploreDimensions = makeFilterable(queryableExploreDimensions)

export type FilterableExploreDimensions = typeof filterableExploreDimensions[number]

export interface ExploreFilter extends Omit<BasicExploreFilter, 'dimension'> {
  dimension: FilterableExploreDimensions
}

export interface ExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
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
  'request_size_p99',
  'request_size_p95',
  'request_size_p50',
  'request_size_average',
  'response_size_average',
] as const

export type ExploreAggregations = typeof exploreAggregations[number]

export type ExploreFilterAll = ExploreFilter | ExploreInFilterV2

export interface ExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: ExploreAggregations[]
  dimensions?: QueryableExploreDimensions[]
  filters?: ExploreFilterAll[]
}

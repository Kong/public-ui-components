import { makeFilterable } from './util'
import type { BasicExploreFilter, BasicExploreQuery } from './basic'
import { basicExploreAggregations, queryableBasicExploreDimensions } from './basic'

export const queryableExploreDimensions = [
  ...queryableBasicExploreDimensions,
  'application',
  'consumer',
  'iso_code',
] as const


export type QueryableExploreDimensions = typeof queryableExploreDimensions[number]

export const fetchableExploreDimensions = queryableExploreDimensions.filter(
  (dimension) => !(searchableLocalExploreDimensions as SearchableLocalExploreDimensions[]).includes(dimension as SearchableLocalExploreDimensions),
)

export type FetchableExploreDimension = Exclude<QueryableExploreDimensions, 'status_code' | 'status_code_grouped' | 'iso_code' | 'time'>

export const filterableFetchableExploreDimensions = makeFilterable(fetchableExploreDimensions)

export type FilterableFetchableExploreDimensions = typeof filterableFetchableExploreDimensions[number]

export const searchableLocalExploreDimensions = [
  'iso_code',
  'status_code',
  'status_code_grouped',
] as const satisfies QueryableExploreDimensions[]

export type SearchableLocalExploreDimensions = typeof searchableLocalExploreDimensions[number]

export const filterableSearchableLocalExploreDimensions = makeFilterable(searchableLocalExploreDimensions)

export type FilterableSearchableLocalExploreDimensions = typeof filterableSearchableLocalExploreDimensions[number]

export interface ExploreFilter extends Omit<BasicExploreFilter, 'dimension'> {
  dimension: FilterableFetchableExploreDimensions | FilterableSearchableLocalExploreDimensions
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

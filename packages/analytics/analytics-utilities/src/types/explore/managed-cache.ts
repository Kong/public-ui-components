import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'

export const queryableManagedCacheExploreDimensions = [
  'control_plane',
  'data_plane_group',
  'managed_cache',
  'network',
  'provider',
  'provider_region',
  'region',
  'time',
] as const

export type QueryableManagedCacheExploreDimensions = typeof queryableManagedCacheExploreDimensions[number]

export const filterableManagedCacheExploreDimensions = makeFilterable(queryableManagedCacheExploreDimensions)

export type FilterableManagedCacheExploreDimensions = typeof queryableManagedCacheExploreDimensions[number]

export interface ManagedCacheExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
  field: FilterableManagedCacheExploreDimensions
}

export interface ManagedCacheExploreEmptyFilterV2 extends Omit<BasicExploreEmptyFilterV2, 'field'> {
  field: FilterableManagedCacheExploreDimensions
}

export const managedCacheExploreAggregations = [
  'cache_eviction_rate',
  'cache_expiration_rate',
  'cache_items_average',
  'cache_memory_utilization_max',
] as const

export type ManagedCacheExploreAggregations = typeof managedCacheExploreAggregations[number]

export type ManagedCacheExploreFilterAll = ManagedCacheExploreInFilterV2 | ManagedCacheExploreEmptyFilterV2

export interface ManagedCacheExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: ManagedCacheExploreAggregations[]
  dimensions?: QueryableManagedCacheExploreDimensions[]
  filters?: ManagedCacheExploreFilterAll[]
}

import { type BasicExploreAggregations, type BasicExploreFilter, filterableFetchableBasicExploreDimensions, filterableSearchableLocalBasicExploreDimensions } from './basic'
import { type AiExploreAggregations, type AiExploreFilter, filterableFetchableAiExploreDimensions, filterableSearchableLocalAiExploreDimensions } from './ai'
import { type ExploreAggregations, type ExploreFilter, filterableFetchableExploreDimensions, filterableSearchableLocalExploreDimensions } from './advanced'

export type AllAggregations = BasicExploreAggregations | AiExploreAggregations | ExploreAggregations
export type AllFilters = BasicExploreFilter | AiExploreFilter | ExploreFilter

export const queryDatasources = ['basic', 'advanced', 'ai'] as const

export type QueryDatasource = typeof queryDatasources[number]

export interface FilterTypeMap extends Record<QueryDatasource, AllFilters> {
  basic: BasicExploreFilter,
  advanced: ExploreFilter,
  ai: AiExploreFilter,
}

export const datasourceToFilterableDimensions: Record<QueryDatasource, Set<string>> = {
  basic: new Set([...filterableFetchableBasicExploreDimensions, ...filterableSearchableLocalBasicExploreDimensions]),
  advanced: new Set([...filterableFetchableExploreDimensions, ...filterableSearchableLocalExploreDimensions]),
  ai: new Set([...filterableFetchableAiExploreDimensions, ...filterableSearchableLocalAiExploreDimensions]),
} as const

// Utility for stripping unknown filters
export const stripUnknownFilters = <K extends keyof typeof datasourceToFilterableDimensions>(datasource: K, filters: AllFilters[]): FilterTypeMap[K][] => {
  // Note: once we extend API request filters, this may need to look at more than just dimensions.
  // Note the cast; we could potentially try to derive the type, but it doesn't seem worth it.
  return filters.filter(f => datasourceToFilterableDimensions[datasource].has(f.dimension)) as FilterTypeMap[K][]
}

// TODO: Add utility func for marking unknown filters (but not stripping them).

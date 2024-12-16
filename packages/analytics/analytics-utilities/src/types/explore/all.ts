import { type BasicExploreAggregations, type BasicExploreFilter, type BasicExploreFilterAll, filterableBasicExploreDimensions } from './basic'
import { type AiExploreAggregations, type AiExploreFilter, type AiExploreFilterAll, filterableAiExploreDimensions } from './ai'
import { type ExploreAggregations, type ExploreFilter, type ExploreFilterAll, filterableExploreDimensions } from './advanced'

export type AllAggregations = BasicExploreAggregations | AiExploreAggregations | ExploreAggregations
export type AllFilters = BasicExploreFilterAll | AiExploreFilterAll | ExploreFilterAll

export const queryDatasources = ['basic', 'advanced', 'ai'] as const

export type QueryDatasource = typeof queryDatasources[number]

export interface FilterTypeMap extends Record<QueryDatasource, AllFilters> {
  basic: BasicExploreFilter,
  advanced: ExploreFilter,
  ai: AiExploreFilter,
}

export const datasourceToFilterableDimensions: Record<QueryDatasource, Set<string>> = {
  basic: new Set(filterableBasicExploreDimensions),
  advanced: new Set(filterableExploreDimensions),
  ai: new Set(filterableAiExploreDimensions),
} as const

// Utility for stripping unknown filters
export const stripUnknownFilters = <K extends keyof typeof datasourceToFilterableDimensions>(datasource: K, filters: AllFilters[]): FilterTypeMap[K][] => {
  return filters.filter(f => {
    if ('dimension' in f) {
      datasourceToFilterableDimensions[datasource].has(f.dimension)
    } else {
      datasourceToFilterableDimensions[datasource].has(f.field)
    }
  }) as FilterTypeMap[K][]
}

// TODO: Add utility func for marking unknown filters (but not stripping them).

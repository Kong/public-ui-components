import { type BasicExploreAggregations, type BasicExploreFilterAll, filterableBasicExploreDimensions } from './basic'
import { type AiExploreAggregations, type AiExploreFilterAll, filterableAiExploreDimensions } from './ai'
import { type ExploreAggregations, type ExploreFilterAll, filterableExploreDimensions } from './advanced'

export type AllAggregations = BasicExploreAggregations | AiExploreAggregations | ExploreAggregations
export type AllFilters = BasicExploreFilterAll | AiExploreFilterAll | ExploreFilterAll

export const queryDatasources = ['basic', 'api_usage', 'llm_usage'] as const

export type QueryDatasource = typeof queryDatasources[number]

export interface FilterTypeMap extends Record<QueryDatasource, AllFilters> {
  basic: BasicExploreFilterAll
  api_usage: ExploreFilterAll
  llm_usage: AiExploreFilterAll
}

export const datasourceToFilterableDimensions: Record<QueryDatasource, Set<string>> = {
  basic: new Set(filterableBasicExploreDimensions),
  api_usage: new Set(filterableExploreDimensions),
  llm_usage: new Set(filterableAiExploreDimensions),
} as const

// Utility for stripping unknown filters
export const stripUnknownFilters = <K extends keyof typeof datasourceToFilterableDimensions>(datasource: K, filters: AllFilters[]): Array<FilterTypeMap[K]> => {
  // Note: once we extend API request filters, this may need to look at more than just dimensions.
  // Note the cast; we could potentially try to derive the type, but it doesn't seem worth it.
  return filters.filter(f => datasourceToFilterableDimensions[datasource].has(f.field)) as Array<FilterTypeMap[K]>
}

// TODO: Add utility func for marking unknown filters (but not stripping them).

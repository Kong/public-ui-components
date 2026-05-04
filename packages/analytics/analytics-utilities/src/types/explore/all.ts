import { type BasicExploreAggregations, type BasicExploreFilterAll, type FilterableBasicExploreDimensions, filterableBasicExploreDimensions } from './basic'
import { type AiExploreAggregations, type AiExploreFilterAll, type FilterableAiExploreDimensions, filterableAiExploreDimensions } from './ai'
import { type ExploreAggregations, type ExploreFilterAll, type FilterableExploreDimensions, filterableExploreDimensions } from './advanced'
import { type FilterableRequestDimensions, type FilterableRequestMetrics, type FilterableRequestWildcardDimensions } from './requests'
import { type PlatformExploreFilterAll } from './platform'
import { filterableAgenticExploreDimensions, type AgenticExploreAggregations, type AgenticExploreFilterAll, type FilterableAgenticExploreDimensions } from './agentic'

export type AllAggregations = BasicExploreAggregations | AiExploreAggregations | ExploreAggregations | AgenticExploreAggregations
export type AllFilters = BasicExploreFilterAll | AiExploreFilterAll | ExploreFilterAll | AgenticExploreFilterAll | PlatformExploreFilterAll
export type AllFilterableDimensionsAndMetrics = FilterableExploreDimensions
  | FilterableAiExploreDimensions
  | FilterableBasicExploreDimensions
  | FilterableAgenticExploreDimensions
  | FilterableRequestDimensions
  | FilterableRequestMetrics
  | FilterableRequestWildcardDimensions

export const queryDatasources = ['basic', 'api_usage', 'llm_usage', 'agentic_usage', 'platform'] as const

export type QueryDatasource = typeof queryDatasources[number]

export type FilterDatasource = QueryDatasource | 'requests'

export interface FilterTypeMap extends Record<QueryDatasource, AllFilters> {
  basic: BasicExploreFilterAll
  api_usage: ExploreFilterAll
  llm_usage: AiExploreFilterAll
  agentic_usage: AgenticExploreFilterAll
  platform: PlatformExploreFilterAll
}

export const datasourceToFilterableDimensions: Record<QueryDatasource, Set<string>> = {
  basic: new Set(filterableBasicExploreDimensions),
  api_usage: new Set(filterableExploreDimensions),
  llm_usage: new Set(filterableAiExploreDimensions),
  agentic_usage: new Set(filterableAgenticExploreDimensions),
  platform: new Set(),
} as const

/**
 * @deprecated Use `useDatasourceConfigStore().stripUnknownFilters` from `@kong-ui-public/analytics-config-store`.
 */
export const stripUnknownFilters = <K extends keyof typeof datasourceToFilterableDimensions>(datasource: K, filters: AllFilters[]): Array<FilterTypeMap[K]> => {
  if (datasource.startsWith('goap')) {
    // We currently can't determine the type for goap datasources as it could be
    // anything so we have to just trust that valid filters were applied
    return filters as any
  }

  if (datasource === 'platform') {
    return filters as Array<FilterTypeMap[K]>
  }

  // Note: once we extend API request filters, this may need to look at more than just dimensions.
  // Note the cast; we could potentially try to derive the type, but it doesn't seem worth it.
  return filters.filter(f => datasourceToFilterableDimensions[datasource].has(f.field)) as Array<FilterTypeMap[K]>
}

// TODO: Add utility func for marking unknown filters (but not stripping them).

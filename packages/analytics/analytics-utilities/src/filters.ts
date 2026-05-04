import type { FilterDatasource } from './types'
import {
  filterableAgenticExploreDimensions,
  filterableAiExploreDimensions,
  filterableBasicExploreDimensions,
  filterableExploreDimensions,
  filterableRequestDimensions,
  filterableRequestMetrics,
} from './types'


/**
 * @deprecated Use `useDatasourceConfigStore().getFieldDataSources` from `@kong-ui-public/analytics-config-store`.
 */
export const getFieldDataSources = (
  dimension: string,
): FilterDatasource[] => {
  const datasources: FilterDatasource[] = []

  if ((filterableBasicExploreDimensions as string[]).includes(dimension)) {
    datasources.push('basic')
  }
  if ((filterableExploreDimensions as string[]).includes(dimension)) {
    datasources.push('api_usage')
  }
  if ((filterableAiExploreDimensions as string[]).includes(dimension)) {
    datasources.push('llm_usage')
  }
  if ((filterableAgenticExploreDimensions as string[]).includes(dimension)) {
    datasources.push('agentic_usage')
  }
  if ((filterableRequestDimensions as string[]).includes(dimension) || (filterableRequestMetrics as string[]).includes(dimension)) {
    datasources.push('requests')
  }

  return datasources
}

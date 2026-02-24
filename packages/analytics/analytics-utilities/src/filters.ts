import type { AllFilterableDimensionsAndMetrics, FilterDatasource } from './types'
import {
  filterableAiExploreDimensions,
  filterableBasicExploreDimensions,
  filterableExploreDimensions,
  filterableMcpExploreDimensions,
  filterableRequestDimensions,
  filterableRequestMetrics,
} from './types'


export const getFieldDataSources = (
  dimension: AllFilterableDimensionsAndMetrics,
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
  if ((filterableMcpExploreDimensions as string[]).includes(dimension)) {
    datasources.push('mcp_usage')
  }
  if ((filterableRequestDimensions as string[]).includes(dimension) || (filterableRequestMetrics as string[]).includes(dimension)) {
    datasources.push('requests')
  }

  return datasources
}

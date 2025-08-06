import type { AllFilterableDimensionsAndMetrics, FilterDatasource } from './types'
import {
  filterableAiExploreDimensions,
  filterableBasicExploreDimensions,
  filterableExploreDimensions,
  filterableRequestDimensions,
  filterableRequestMetrics,
} from './types'


export const getFieldDataSources = (dimension: AllFilterableDimensionsAndMetrics) => {
  const datasources = new Set<FilterDatasource>()

  if ((filterableBasicExploreDimensions as string[]).includes(dimension)) {
    datasources.add('basic')
  }
  if ((filterableExploreDimensions as string[]).includes(dimension)) {
    datasources.add('api_usage')
  }
  if ((filterableAiExploreDimensions as string[]).includes(dimension)) {
    datasources.add('llm_usage')
  }
  if ((filterableRequestDimensions as string[]).includes(dimension) || (filterableRequestMetrics as string[]).includes(dimension) || (filterableRequestDimensions as string[]).includes(dimension)) {
    datasources.add('requests')
  }

  return Array.from(datasources)
}

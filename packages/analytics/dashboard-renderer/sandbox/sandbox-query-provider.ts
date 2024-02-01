import type { Plugin } from 'vue'
import { nonTsExploreResponse, timeSeriesExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src/constants'
import type { AnalyticsBridge, ExploreQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

const delayedResponse = <T>(response: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

const queryFn = async (query: ExploreQuery): Promise<ExploreResultV4> => {
  if (query.dimensions && query.dimensions.findIndex(d => d === 'time') > -1) {
    return await delayedResponse(timeSeriesExploreResponse)
  }
  return await delayedResponse(nonTsExploreResponse)
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { queryFn } as AnalyticsBridge)
  },
}

export default sandboxQueryProvider

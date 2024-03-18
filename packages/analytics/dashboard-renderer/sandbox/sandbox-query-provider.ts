import type { Plugin } from 'vue'
import { nonTsExploreResponse, timeSeriesExploreResponse, routeExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src/constants'
import type { AnalyticsBridge, AnalyticsConfigV2, ExploreQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

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
  if (query.dimensions && query.dimensions.findIndex(d => d === 'route') > -1) {
    return await delayedResponse(routeExploreResponse)
  }

  return await delayedResponse(nonTsExploreResponse)
}

const configFn = (): Promise<AnalyticsConfigV2> => Promise.resolve({
  analytics: {
    percentiles: true,
    retention_ms: 2592000000, // 30d
  },
  requests: {
    retention_ms: 86400000,
  },
})

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { queryFn, configFn } as AnalyticsBridge)
  },
}

export default sandboxQueryProvider

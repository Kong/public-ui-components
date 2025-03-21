import type { Component, Plugin } from 'vue'
import { nonTsExploreResponse, routeExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src'
import { generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsBridge, AnalyticsConfigV2, DatasourceAwareQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { EntityLink } from '@kong-ui-public/entities-shared'

const delayedResponse = <T>(response: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

const queryFn = async (query: DatasourceAwareQuery): Promise<ExploreResultV4> => {
  console.log('Querying data:', query)
  if (query.query.dimensions && query.query.dimensions.includes('time')) {
    return await delayedResponse(
      generateSingleMetricTimeSeriesData(
        { name: 'requests', unit: 'count' },
        { status_code: ['200', '400', '500'] },
      ),
    )
  }
  if (query.query.dimensions && query.query.dimensions.findIndex(d => d === 'route') > -1) {
    return await delayedResponse(routeExploreResponse)
  }

  if (query.query.limit) {
    return {
      ...nonTsExploreResponse,
      data: nonTsExploreResponse.data.slice(0, query.query.limit),
    }
  }

  return await delayedResponse(nonTsExploreResponse)
}

const configFn = (): Promise<AnalyticsConfigV2> => {
  return new Promise(resolve => {
    window.setTimeout(() => {
      console.log('Analytics config resolved')
      resolve({
        analytics: {
          percentiles: true,
          retention_ms: 2592000000, // 30d
        },
        requests: {
          retention_ms: 86400000,
        },
      })
    }, 1000)
  })
}

const evaluateFeatureFlagFn = () => true

const exploreBaseUrl = () => 'https://cloud.konghq.tech/us/analytics/explorer'

const fetchComponent = async (name: string): Promise<Component> => {
  return Promise.resolve(EntityLink)
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { queryFn, configFn, evaluateFeatureFlagFn, exploreBaseUrl, fetchComponent } as AnalyticsBridge)
  },
}

export default sandboxQueryProvider

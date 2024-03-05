import type { Plugin } from 'vue'
import { nonTsExploreResponse, timeSeriesExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src/constants'
import type { AnalyticsBridge, ExploreQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { generateCrossSectionalData, generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'

const delayedResponse = <T>(response: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

const queryFn = async (query: ExploreQuery): Promise<ExploreResultV4> => {
  // Dimensions to use if query is not provided
  const dimensionMap = { statusCode: ['1XX', '2XX', '3XX', '4XX', '5XX'] }

  if (query.dimensions && query.dimensions.findIndex(d => d === 'time') > -1) {
    if (query.metrics && query.metrics[0] === 'request_count') {
      // Traffic + Error rate cards
      return await delayedResponse(nonTsExploreResponse)
    } else if (query.metrics && query.metrics[0] === 'response_latency_p99' && query.metrics.length === 1) {
      // Latency metrics card
      return await delayedResponse(timeSeriesExploreResponse)
    } else {
      // Timeseries Line chart
      const timeSeriesResponse = generateSingleMetricTimeSeriesData(
        { name: 'TotalRequests', unit: 'count' },
        { statusCode: query.metrics as string[] },
      ) as ExploreResultV4

      return await delayedResponse(timeSeriesResponse)
    }
  } else {
    // Bar charts (non-time series)
    const nonTimeSeriesResponse = generateCrossSectionalData(
      [
        { name: 'TotalRequests', unit: 'count' },
      ],
      dimensionMap,
    ) as ExploreResultV4

    return await delayedResponse(nonTimeSeriesResponse)
  }
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { queryFn } as AnalyticsBridge)
  },
}

export default sandboxQueryProvider

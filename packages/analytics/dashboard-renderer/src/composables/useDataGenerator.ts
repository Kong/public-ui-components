import {
  generateSingleMetricTimeSeriesData,
  generateMultipleMetricTimeSeriesData,
  type Metric,
} from '@kong-ui-public/analytics-utilities'
import type { AnalyticsBridge, AnalyticsConfigV2, DatasourceAwareQuery, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { Component } from 'vue'
import { EntityLink } from '@kong-ui-public/entities-shared'
import { provide } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../constants'

export default function useDataGenerator(): void {
  const delayedResponse = <T>(response: T): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(response)
      }, 1000)
    })
  }

  // export const generateSingleMetricTimeSeriesData = (metric: Metric, dimensionMap?: DimensionMap, metaOverrides?: Partial<QueryResponseMeta>) => {
  // export const generateMultipleMetricTimeSeriesData = (metrics: Metric[], metaOverrides?: Partial<QueryResponseMeta>) => {

  const queryFn = async (query: DatasourceAwareQuery): Promise<ExploreResultV4> => {
    console.log('query is: ', query)
    const { dimensions, metrics = [] } = query.query
    if (dimensions && dimensions.includes('time')) {
      const generatorMetrics: Metric[] = metrics.map((name) => ({ name, unit: 'count' }))

      if (generatorMetrics.length === 1) {
        return await delayedResponse(
          generateSingleMetricTimeSeriesData(
            generatorMetrics[0],
          ),
        )
      }

      if (generatorMetrics.length > 1) {
        return await delayedResponse(
          generateMultipleMetricTimeSeriesData(
            generatorMetrics,
          ),
        )
      }
    }
    /*
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
    */
    return await delayedResponse(
      generateSingleMetricTimeSeriesData(
        { name: 'requests', unit: 'count' },
        { status_code: ['200', '400', '500'] },
      ),
    )
  }

  const configFn = (): Promise<AnalyticsConfigV2> => {
    return delayedResponse({
      analytics: {
        percentiles: true,
        retention_ms: 2592000000, // 30d
      },
      requests: {
        retention_ms: 86400000,
      },
    })
  }

  const evaluateFeatureFlagFn = () => true // TODO can we just... actually evaluate ff here?

  const exploreBaseUrl = async () => 'https://cloud.konghq.com/us/analytics/explorer'

  const fetchComponent = async (): Promise<Component> => {
    return Promise.resolve(EntityLink)
  }

  const mockQueryBridge = {
    queryFn,
    configFn,
    evaluateFeatureFlagFn,
    exploreBaseUrl,
    fetchComponent,
  } as AnalyticsBridge

  provide(INJECT_QUERY_PROVIDER, mockQueryBridge)
}

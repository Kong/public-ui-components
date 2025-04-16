import type {
  Timeframe,
  ExploreAggregations, QueryableExploreDimensions, AnalyticsBridge, QueryDatasource,
  ExploreFilterAll,
} from '@kong-ui-public/analytics-utilities'
import type { Ref } from 'vue'

export interface MetricFetcherOptions {
  datasource: Ref<QueryDatasource>
  metrics: Ref<ExploreAggregations[]>
  dimensions?: QueryableExploreDimensions[]
  filter: Ref<ExploreFilterAll[] | undefined>
  timeframe: Ref<Timeframe>
  tz: Ref<string>
  refreshInterval: number
  withTrend: Ref<boolean>
  queryReady: Ref<boolean>
  queryFn: AnalyticsBridge['queryFn']
  abortController?: AbortController
  refreshCounter: Ref<number>
}

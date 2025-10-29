import type {
  ExploreAggregations, QueryableExploreDimensions, AnalyticsBridge, QueryDatasource,
  ExploreFilterAll,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import type { Ref } from 'vue'

export interface MetricFetcherOptions {
  datasource: Ref<QueryDatasource>
  metrics: Ref<ExploreAggregations[]>
  dimensions?: QueryableExploreDimensions[]
  filter: Ref<ExploreFilterAll[] | undefined>
  timeRange: Ref<TimeRangeV4>
  refreshInterval: number
  withTrend: Ref<boolean>
  queryReady: Ref<boolean>
  queryFn: AnalyticsBridge['queryFn']
  abortController?: AbortController
  refreshCounter: Ref<number>
}

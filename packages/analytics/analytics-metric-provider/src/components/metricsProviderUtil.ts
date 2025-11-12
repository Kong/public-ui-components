import {
  type AnalyticsBridge,
  type ExploreAggregations,
  type ExploreFilterAll,
  type FilterableExploreDimensions,
  type QueryDatasource, stripUnknownFilters,
  type TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import type { MetricFetcherOptions } from '../types'
import { computed, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { FetcherResult } from '../composables/useMetricFetcher'

interface ProviderData {
  data: {
    traffic: FetcherResult
    latency: FetcherResult
  }
  containerTitle: Ref<string | undefined>
  description: Ref<string | undefined>
  hasTrendAccess: Ref<boolean>
  longCardTitles: boolean
  averageLatencies: Ref<boolean>
}

export const METRICS_PROVIDER_KEY = Symbol('METRICS_PROVIDER_KEY') as InjectionKey<ProviderData>

interface FetcherOptions {
  datasource: Ref<QueryDatasource>
  dimension?: FilterableExploreDimensions
  dimensionFilterValue?: string
  additionalFilter: Ref<ExploreFilterAll[] | undefined>
  queryReady: Ref<boolean>
  timeRange: Ref<TimeRangeV4>
  hasTrendAccess: Ref<boolean>
  refreshInterval: number
  queryFn: AnalyticsBridge['queryFn']
  averageLatencies: Ref<boolean>
  abortController?: AbortController
  refreshCounter: Ref<number>
}

export const defaultFetcherDefs = (opts: FetcherOptions) => {
  const {
    datasource,
    dimension,
    dimensionFilterValue,
    additionalFilter,
    queryReady,
    timeRange,
    hasTrendAccess,
    refreshInterval,
    abortController,
    queryFn,
    averageLatencies,
  } = opts

  if (dimensionFilterValue && !dimension) {
    throw new Error('Must provide a dimension if filtering by a value')
  }

  const singleEntityQuery = !!(dimension && dimensionFilterValue)
  const multiEntityQuery = !!(dimension && !dimensionFilterValue)

  const filter = computed<ExploreFilterAll[]>(() => {
    const retval: ExploreFilterAll[] = []

    if (singleEntityQuery) {
      retval.push({
        field: dimension,
        operator: 'in',
        value: [dimensionFilterValue],
      })
    }

    if (additionalFilter.value) {
      // TODO: Decide if it's worth making this generic on datasource.
      retval.push(...stripUnknownFilters(datasource.value, additionalFilter.value) as ExploreFilterAll[])
    }

    return retval
  })

  const trafficMetricFetcherOptions: MetricFetcherOptions = {
    datasource,

    metrics: ref([
      'request_count',
    ]),

    // Traffic and error rate cards should only try to query for the dimension if it's going to be used.
    // It isn't used for single entity queries.
    dimensions: [
      ...((dimension && !singleEntityQuery) ? [dimension] : []),
      'status_code_grouped',
    ],

    filter,
    queryReady,
    timeRange,

    // Traffic and error rate cards can't query trend if multiple entities are expected.
    withTrend: computed<boolean>(() => hasTrendAccess.value && !multiEntityQuery),

    refreshInterval,
    queryFn,
    abortController,
    refreshCounter: opts.refreshCounter,
  }

  const latencyMetricFetcherOptions: MetricFetcherOptions = {
    datasource,

    metrics: computed<ExploreAggregations[]>(() => [
      averageLatencies.value ? 'response_latency_average' : 'response_latency_p99',
    ]),

    // To keep single-entity queries consistent, don't bother querying the dimension for latency
    // in the single-entity case, even though it's possible.
    ...((dimension && !singleEntityQuery) ? { dimensions: [dimension] } : {}),

    filter,
    queryReady,
    timeRange,

    // Don't query latency trends in the multi-entity case: it's possible, but wasteful.
    withTrend: computed<boolean>(() => hasTrendAccess.value && !multiEntityQuery),

    refreshInterval,
    queryFn,
    abortController,
    refreshCounter: opts.refreshCounter,
  }

  const trafficData = composables.useMetricFetcher(trafficMetricFetcherOptions)
  const latencyData = composables.useMetricFetcher(latencyMetricFetcherOptions)

  return {
    trafficData,
    latencyData,
  }
}

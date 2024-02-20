import type {
  AnalyticsBridge,
  ExploreFilter,
  QueryableExploreDimensions,
  Timeframe,
} from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import type { MetricFetcherOptions } from '../types'
import { computed } from 'vue'
import type { InjectionKey, Ref } from 'vue'

interface ProviderData {
  data: {
    [key: string]: any // TODO
  },
  description?: string,
  hasTrendAccess: boolean,
  longCardTitles: boolean,
  trendRange: Ref<string>,
}

export const METRICS_PROVIDER_KEY = Symbol('METRICS_PROVIDER_KEY') as InjectionKey<ProviderData>

interface FetcherOptions {
  dimension?: QueryableExploreDimensions
  dimensionFilterValue?: string
  additionalFilter: Ref<ExploreFilter[] | undefined>
  queryReady: Ref<boolean>
  timeframe: Ref<Timeframe>
  hasTrendAccess: boolean
  refreshInterval: number
  queryFn: AnalyticsBridge['queryFn']
  abortController?: AbortController
}

export const defaultFetcherDefs = (opts: FetcherOptions) => {
  const {
    dimension,
    dimensionFilterValue,
    additionalFilter,
    queryReady,
    timeframe,
    hasTrendAccess,
    refreshInterval,
    abortController,
    queryFn,
  } = opts

  if (dimensionFilterValue && !dimension) {
    throw new Error('Must provide a dimension if filtering by a value')
  }

  const singleEntityQuery = !!(dimension && dimensionFilterValue)
  const multiEntityQuery = !!(dimension && !dimensionFilterValue)

  const filter = computed<ExploreFilter[]>(() => {
    const retval: ExploreFilter[] = []

    if (singleEntityQuery) {
      retval.push({
        dimension,
        type: 'in',
        values: [dimensionFilterValue],
      })
    }

    if (additionalFilter.value) {
      retval.push(...additionalFilter.value)
    }

    return retval
  })

  const trafficMetricFetcherOptions: MetricFetcherOptions = {
    metrics: [
      'request_count',
    ],

    // Traffic and error rate cards should only try to query for the dimension if it's going to be used.
    // It isn't used for single entity queries.
    dimensions: [
      ...((dimension && !singleEntityQuery) ? [dimension] : []),
      'status_code_grouped',
    ],

    filter,
    queryReady,
    timeframe,

    // Traffic and error rate cards can't query trend if multiple entities are expected.
    withTrend: hasTrendAccess && !multiEntityQuery,

    refreshInterval,
    queryFn,
    abortController,
  }

  const latencyMetricFetcherOptions: MetricFetcherOptions = {
    metrics: [
      'response_latency_p99',
    ],

    // To keep single-entity queries consistent, don't bother querying the dimension for latency
    // in the single-entity case, even though it's possible.
    ...((dimension && !singleEntityQuery) ? { dimensions: [dimension] } : {}),

    filter,
    queryReady,
    timeframe,

    // Don't query latency trends in the multi-entity case: it's possible, but wasteful.
    withTrend: hasTrendAccess && !multiEntityQuery,

    refreshInterval,
    queryFn,
    abortController,
  }

  const trafficData = composables.useMetricFetcher(trafficMetricFetcherOptions)
  const latencyData = composables.useMetricFetcher(latencyMetricFetcherOptions)

  return {
    trafficData,
    latencyData,
  }
}

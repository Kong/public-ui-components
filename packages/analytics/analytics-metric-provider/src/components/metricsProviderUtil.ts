import { Timeframe } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import { DataFetcher, EXPLORE_V2_AGGREGATIONS, EXPLORE_V2_DIMENSIONS, ExploreV2Filter, MetricFetcherOptions, EXPLORE_V2_FILTER_TYPES } from '../types'
import { Ref, InjectionKey, computed } from 'vue'

interface ProviderData {
  data: {
    [key: string]: any // TODO
  },
  hasTrendAccess: boolean,
  longCardTitles: boolean,
}

export const METRICS_PROVIDER_KEY = Symbol('METRICS_PROVIDER_KEY') as InjectionKey<ProviderData>

interface FetcherOptions {
  dimension?: EXPLORE_V2_DIMENSIONS
  dimensionFilterValue?: string
  additionalFilter: Ref<ExploreV2Filter[] | undefined>
  queryReady: Ref<boolean>
  timeframe: Ref<Timeframe>
  hasTrendAccess: boolean
  refreshInterval: number
  dataFetcher: DataFetcher
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
    dataFetcher,
  } = opts

  if (dimensionFilterValue && !dimension) {
    throw new Error('Must provide a dimension if filtering by a value')
  }

  const singleEntityQuery = !!(dimension && dimensionFilterValue)
  const multiEntityQuery = !!(dimension && !dimensionFilterValue)

  const filter = computed<ExploreV2Filter[]>(() => {
    const retval: ExploreV2Filter[] = []

    if (singleEntityQuery) {
      retval.push({
        dimension,
        type: EXPLORE_V2_FILTER_TYPES.IN,
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
      EXPLORE_V2_AGGREGATIONS.REQUEST_COUNT,
    ],

    // Traffic and error rate cards should only try to query for the dimension if it's going to be used.
    // It isn't used for single entity queries.
    dimensions: [
      ...((dimension && !singleEntityQuery) ? [dimension] : []),
      EXPLORE_V2_DIMENSIONS.STATUS_CODE_GROUPED,
    ],

    filter,
    queryReady,
    timeframe,

    // Traffic and error rate cards can't query trend if multiple entities are expected.
    withTrend: hasTrendAccess && !multiEntityQuery,

    refreshInterval,
    dataFetcher,
  }

  const latencyMetricFetcherOptions: MetricFetcherOptions = {
    metrics: [
      EXPLORE_V2_AGGREGATIONS.RESPONSE_LATENCY_P99,
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
    dataFetcher,
  }

  const trafficData = composables.useMetricFetcher(trafficMetricFetcherOptions)
  const latencyData = composables.useMetricFetcher(latencyMetricFetcherOptions)

  return {
    trafficData,
    latencyData,
  }
}

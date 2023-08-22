import type { Ref } from 'vue'
import { computed } from 'vue'
import { DeltaQueryTime, UnaryQueryTime } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsExploreV2Result, QueryTime } from '@kong-ui-public/analytics-utilities'
import { EXPLORE_V2_DIMENSIONS } from '../types'
import type { EXPLORE_V2_AGGREGATIONS, ExploreV2Query, MetricFetcherOptions } from '../types'
import { MAX_ANALYTICS_REQUEST_RETRIES } from '../constants'
import composables from '.'
import type { AxiosResponse } from 'axios'
import { useSwrvState } from '@kong-ui-public/core'

export const DEFAULT_KEY = Symbol('default')
export type MappedMetrics = Record<string | typeof DEFAULT_KEY, Record<string | typeof DEFAULT_KEY, number>>

// This dimension is special: metric cards are never going to group on this dimension
// except in order to determine traffic and error rate information.
const ERROR_RATE_DIMENSION = EXPLORE_V2_DIMENSIONS.STATUS_CODE_GROUPED

export interface ChronologicalMappedMetrics {
  current: MappedMetrics
  previous: MappedMetrics
}

export interface FetcherResult {
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  raw: Ref<AxiosResponse<AnalyticsExploreV2Result, any> | undefined>
  mapped: Ref<ChronologicalMappedMetrics>
}

const setMetric = (result: ChronologicalMappedMetrics, time: 'previous' | 'current', topLevelKey: string | typeof DEFAULT_KEY, secondLevelKey: string | typeof DEFAULT_KEY, metricValue: number) => {
  if (!result[time][topLevelKey]) {
    result[time][topLevelKey] = {} as Record<string | typeof DEFAULT_KEY, number>
  }
  result[time][topLevelKey][secondLevelKey] = metricValue
}

export function buildDeltaMapping(result: AnalyticsExploreV2Result, queryTime: QueryTime, withTrend: boolean): ChronologicalMappedMetrics {
  // We should always have metric names in the result; if they're not present, just pick something that won't crash.
  const metricName = result.meta.metricNames?.[0] || ''

  // We only ever have 2 dimensions in the response if the second dimension is STATUS_CODE_GROUPED.
  // TIME doesn't show up in the response.
  // Assert that this is the case; raise a reportable error if not.
  const dimensionNames = Object.keys(result.meta.dimensions || {})
  const hasErrorRateDimension = !!dimensionNames.find(k => k === ERROR_RATE_DIMENSION)
  const keyDimension = dimensionNames.find(k => k !== ERROR_RATE_DIMENSION)

  if (dimensionNames.length > 2 || (dimensionNames.length > 1 && !hasErrorRateDimension)) {
    console.error("Don't know how to work with provided dimensions:", dimensionNames)
    return {
      previous: { [DEFAULT_KEY]: { [DEFAULT_KEY]: 0 } },
      current: { [DEFAULT_KEY]: { [DEFAULT_KEY]: 0 } },
    }
  }

  // Go through each record and add it to the correct group.
  // Explore always returns results sorted in ascending order by time.
  return result.records.reduce<ChronologicalMappedMetrics>((result, record) => {
    const metricValue = record.event[metricName] as number

    // If we have dimensions, then index the results based on the dimension name.
    // If we don't have dimensions, insert a synthetic key (DEFAULT_KEY).
    const topLevelKey = keyDimension ? record.event[keyDimension] as string : DEFAULT_KEY

    // If we have the error rate key, then index the 2nd level results based on that.
    // Otherwise, insert a synthetic key (DEFAULT_KEY).
    const secondLevelKey = hasErrorRateDimension ? record.event[ERROR_RATE_DIMENSION] as string : DEFAULT_KEY

    // The records are in ascending order, so the first record is the earliest.
    // If the timestamp of the current record is the same as the query start date, it belongs to
    // the previous group, otherwise it belongs to the current group.
    if (new Date(record.timestamp).getTime() === queryTime.startDate().getTime() && withTrend) {
      setMetric(result, 'previous', topLevelKey, secondLevelKey, metricValue)
    } else {
      setMetric(result, 'current', topLevelKey, secondLevelKey, metricValue)
    }

    return result
  }, {
    previous: {},
    current: {},
  } as ChronologicalMappedMetrics)
}

export default function useMetricFetcher(opts: MetricFetcherOptions): FetcherResult {
  if (opts.queryReady === undefined) {
    opts.queryReady = computed(() => true)
  }

  const queryTime: Ref<QueryTime> = computed(() => {
    return opts.withTrend ? new DeltaQueryTime(opts.timeframe.value) : new UnaryQueryTime(opts.timeframe.value)
  })

  const query: Ref<ExploreV2Query> = computed(() => ({
    metrics: opts.metrics as EXPLORE_V2_AGGREGATIONS[],
    dimensions: [
      ...(opts.dimensions?.length ? [...opts.dimensions as EXPLORE_V2_DIMENSIONS[]] : []),
      ...(opts.withTrend ? [EXPLORE_V2_DIMENSIONS.TIME] : []),
    ],
    granularityMs: queryTime.value.granularityMs(),
    ...(opts.filter.value?.length ? { filter: opts.filter.value } : {}),
  }))

  const timeRangeString = computed(() => `${queryTime.value.endDate().toString()}-${queryTime.value.startDate().toString()}`)
  const cacheKey: Ref<string | null> = computed(() => {
    if (!opts.queryReady?.value || (opts.featureFlags && !opts.featureFlags.every(e => e))) {
      return null
    }

    const additionalFilterKey = opts.filter?.value ? JSON.stringify(opts.filter.value) : ''
    // need to have some uniqueness in the cache key to avoid collisions.
    // this was happening when there are multiple providers on the same page with the same dimensions and metrics.
    // For example the singleProvider and multiProvider that appear in the test harness.
    return `metric-fetcher-${timeRangeString.value}-${opts.dimensions?.join('-')}-${opts.metrics?.join('-')}-${additionalFilterKey}`
  })

  const { response: raw, error: metricError, isValidating: isMetricDataValidating } = composables.useRequest<AnalyticsExploreV2Result>(
    () => cacheKey.value,
    () => opts.dataFetcher(queryTime.value, query.value),
    {
      refreshInterval: opts.refreshInterval,
      revalidateOnFocus: false,
      errorRetryCount: MAX_ANALYTICS_REQUEST_RETRIES,
    },
  )

  const { state: metricRequestState, swrvState: STATE } = useSwrvState(raw, metricError, isMetricDataValidating)

  const mapped = computed<ChronologicalMappedMetrics>(() => {
    if (!raw.value?.data?.records?.length || !raw.value?.data?.meta?.dimensions || !raw.value?.data?.meta?.metricNames?.length) {
      // Invalid or empty result.
      return { current: {}, previous: {} } as ChronologicalMappedMetrics
    }

    return buildDeltaMapping(raw.value.data, queryTime.value, !!opts.withTrend)
  })

  return {
    isLoading: computed(() => STATE.PENDING === metricRequestState.value),
    hasError: computed(() => STATE.ERROR === metricRequestState.value),
    raw,
    mapped,
  }
}

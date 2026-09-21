import type { Ref } from 'vue'
import { computed } from 'vue'
import type {
  ExploreQuery,
  ExploreResultV4,
} from '@kong-ui-public/analytics-utilities'
import type { ChronologicalMappedMetrics, MetricFetcherOptions } from '../types'
import { MAX_ANALYTICS_REQUEST_RETRIES } from '../constants'
import composables from '.'
import { useSwrvState } from '@kong-ui-public/core'
import { buildDeltaMapping } from '../utilities'

export interface FetcherResult {
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  raw: Ref<ExploreResultV4 | undefined>
  mapped: Ref<ChronologicalMappedMetrics>
  trendRange: Ref<string>
}

export default function useMetricFetcher(opts: MetricFetcherOptions): FetcherResult {
  if (opts.queryReady === undefined) {
    opts.queryReady = computed(() => true)
  }

  const query: Ref<ExploreQuery> = computed(() => ({
    metrics: opts.metrics.value,
    dimensions: [
      ...(opts.dimensions?.length ? [...opts.dimensions] : []),
      ...(opts.withTrend.value ? ['time'] : []),
    ],
    granularity: opts.withTrend.value ? 'trend' : undefined,
    ...(opts.filter.value?.length ? { filters: opts.filter.value } : {}),
    time_range: opts.timeRange.value,
  } as ExploreQuery))

  const cacheKey: Ref<string | null> = computed(() => {
    if (!opts.queryReady?.value) {
      return null
    }

    const additionalFilterKey = opts.filter?.value ? JSON.stringify(opts.filter.value) : ''
    // need to have some uniqueness in the cache key to avoid collisions.
    // this was happening when there are multiple providers on the same page with the same dimensions and metrics.
    // For example the singleProvider and multiProvider that appear in the test harness.
    return `metric-fetcher-${JSON.stringify(opts.timeRange.value)}-${opts.dimensions?.join('-')}-${opts.metrics.value?.join('-')}-${additionalFilterKey}-${opts.refreshCounter.value}`
  })

  const { response: raw, error: metricError, isValidating: isMetricDataValidating } = composables.useRequest<ExploreResultV4>(
    () => cacheKey.value,
    () => opts.queryFn({
      // TODO: Use a type guard to validate that if the datasource is basic,
      // the query is a valid basic explore query.
      datasource: opts.datasource.value as 'api_usage',
      query: query.value,
    }, opts.abortController ?? new AbortController()),
    {
      refreshInterval: opts.refreshInterval,
      revalidateOnFocus: false,
      errorRetryCount: MAX_ANALYTICS_REQUEST_RETRIES,
    },
  )

  const { state: metricRequestState, swrvState: STATE } = useSwrvState(raw as unknown as Ref<ExploreResultV4 | undefined>, metricError as unknown as Ref<{ message: string } | undefined>, isMetricDataValidating as unknown as Ref<boolean>)

  const mapped = computed<ChronologicalMappedMetrics>(() => {
    if (!raw.value?.data?.length || !raw.value?.meta?.display || !raw.value?.meta?.metric_names?.length) {
      // Invalid or empty result.
      return { current: {}, previous: {} } as ChronologicalMappedMetrics
    }

    return buildDeltaMapping(raw.value, opts.withTrend.value)
  })

  const trendRange = composables.useTrendRange(opts.withTrend, opts.timeRange, computed(() => raw.value?.meta))

  return {
    isLoading: computed(() => STATE.PENDING === metricRequestState.value),
    hasError: computed(() => STATE.ERROR === metricRequestState.value),
    raw: raw as unknown as Ref<ExploreResultV4 | undefined>,
    mapped,
    trendRange,
  }
}

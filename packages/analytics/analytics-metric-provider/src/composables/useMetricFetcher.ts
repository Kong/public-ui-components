import type { Ref } from 'vue'
import { computed } from 'vue'
import type {
  ExploreQuery,
  QueryableExploreDimensions,
  ExploreResultV4,
} from '@kong-ui-public/analytics-utilities'
import type { MetricFetcherOptions } from '../types'
import { MAX_ANALYTICS_REQUEST_RETRIES } from '../constants'
import composables from '.'
import { useSwrvState } from '@kong-ui-public/core'

export const DEFAULT_KEY = Symbol('default')
export type MappedMetrics = Record<string | typeof DEFAULT_KEY, Record<string | typeof DEFAULT_KEY, number>>

// This dimension is special: metric cards are never going to group on this dimension
// except in order to determine traffic and error rate information.
const ERROR_RATE_DIMENSION: QueryableExploreDimensions = 'status_code_grouped'

export interface ChronologicalMappedMetrics {
  current: MappedMetrics
  previous: MappedMetrics
}

export interface FetcherResult {
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  raw: Ref<ExploreResultV4 | undefined>
  mapped: Ref<ChronologicalMappedMetrics>
  trendRange: Ref<string>
}

const setMetric = (result: ChronologicalMappedMetrics, time: 'previous' | 'current', topLevelKey: string | typeof DEFAULT_KEY, secondLevelKey: string | typeof DEFAULT_KEY, metricValue: number) => {
  if (!result[time][topLevelKey]) {
    result[time][topLevelKey] = {} as Record<string | typeof DEFAULT_KEY, number>
  }
  result[time][topLevelKey][secondLevelKey] = metricValue
}

export function buildDeltaMapping(result: ExploreResultV4, withTrend: boolean): ChronologicalMappedMetrics {
  // We should always have metric names in the result; if they're not present, just pick something that won't crash.
  const metricName = result.meta.metric_names?.[0] || ''

  // Figure out the first expected timestamp.
  const queriedStartTime = result.meta.start_ms

  // We only ever have 2 dimensions in the response if the second dimension is STATUS_CODE_GROUPED.
  // TIME doesn't show up in the response.
  // Assert that this is the case; raise a reportable error if not.
  const dimensionNames = Object.keys(result.meta.display || {})
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
  return result.data.reduce<ChronologicalMappedMetrics>((result, record) => {
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
    if (new Date(record.timestamp).getTime() === queriedStartTime && withTrend) {
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

  const { i18n } = composables.useI18n()

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

  const { state: metricRequestState, swrvState: STATE } = useSwrvState(raw, metricError, isMetricDataValidating)

  const mapped = computed<ChronologicalMappedMetrics>(() => {
    if (!raw.value?.data?.length || !raw.value?.meta?.display || !raw.value?.meta?.metric_names?.length) {
      // Invalid or empty result.
      return { current: {}, previous: {} } as ChronologicalMappedMetrics
    }

    return buildDeltaMapping(raw.value, opts.withTrend.value)
  })

  // If one of our relative timeframes, we display the requested time frame (if user has trend access); otherwise fall back to one day
  // Else, we have a Custom start and end datetime coming from v-calendar, so we display "vs previous X days"
  const trendRange = computed<string>(() => {
    if (opts.timeRange.value.type === 'absolute') {
      if (!raw.value?.meta?.start_ms) {
        return ''
      }

      const { start_ms: startMs, end_ms: endMs } = raw.value.meta

      let numDays = (endMs - startMs) / (1000 * 60 * 60 * 24)
      let numHours = (endMs - startMs) / (1000 * 60 * 60)
      let numMinutes = (endMs - startMs) / (1000 * 60)

      if (opts.withTrend.value) {
        // If we're querying a trend, then the time range queried is doubled.
        numDays /= 2
        numHours /= 2
        numMinutes /= 2
      }

      if (numDays >= 1) {
        return i18n.t('trendRange.custom_days', { numDays: Math.round(numDays) })
      } else if (numHours >= 1) {
        return i18n.t('trendRange.custom_hours', { numHours: Math.round(numHours) })
      } else if (numMinutes >= 1) {
        return i18n.t('trendRange.custom_minutes', { numMinutes: Math.round(numMinutes) })
      }

      // Avoid weirdness around daylight savings time by rounding up or down to the nearest day.
      return i18n.t('trendRange.custom_days', { numDays: Math.round(numDays) })
    } else {
      return opts.withTrend.value
        // @ts-ignore - dynamic i18n key
        ? i18n.t(`trendRange.${opts.timeRange.value.time_range}`)
        // If we're unable to query with a trend, we can't render a meaningful trend range description.
        : ''
    }
  })

  return {
    isLoading: computed(() => STATE.PENDING === metricRequestState.value),
    hasError: computed(() => STATE.ERROR === metricRequestState.value),
    raw,
    mapped,
    trendRange,
  }
}

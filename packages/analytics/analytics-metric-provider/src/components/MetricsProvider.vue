<template>
  <slot
    :has-trend-access="hasTrendAccess"
    :timeframe="timeframe"
  />
</template>
<script setup lang="ts">
import { inject, computed, provide, toRef } from 'vue'
import {
  type AnalyticsBridge,
  type ExploreFilter,
  queryableExploreDimensions,
  type FilterableExploreDimensions,
  type QueryDatasource,
  type Timeframe,
} from '@kong-ui-public/analytics-utilities'
import { TimePeriods, TimeframeKeys } from '@kong-ui-public/analytics-utilities'
import { METRICS_PROVIDER_KEY, defaultFetcherDefs } from './metricsProviderUtil'
import { INJECT_QUERY_PROVIDER, DEFAULT_REFRESH_INTERVAL } from '../constants'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'

const props = withDefaults(defineProps<{
  datasource?: QueryDatasource
  maxTimeframe?: TimeframeKeys,
  overrideTimeframe?: Timeframe,
  tz?: string,
  dimension?: FilterableExploreDimensions,
  filterValue?: string,
  additionalFilter?: ExploreFilter[],
  queryReady?: boolean,
  refreshInterval?: number,
  longCardTitles?: boolean,
  containerTitle?: string,
  description?: string,
  percentileLatency?: boolean,
  abortController?: AbortController,
}>(), {
  datasource: undefined,
  maxTimeframe: TimeframeKeys.THIRTY_DAY,
  overrideTimeframe: undefined,
  tz: undefined,
  dimension: undefined,
  filterValue: undefined,
  additionalFilter: undefined,
  queryReady: true,
  refreshInterval: DEFAULT_REFRESH_INTERVAL,
  longCardTitles: false,
  containerTitle: undefined,
  description: undefined,
  percentileLatency: undefined,
  abortController: undefined,
})

// Fail early if there's a programming error.
if (props.dimension && queryableExploreDimensions.findIndex(x => x === props.dimension) === -1) {
  throw new Error(`Attempted to use MetricsProvider with an invalid dimension: ${props.dimension}`)
}

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

let queryFn: AnalyticsBridge['queryFn']

if (!queryBridge) {
  console.warn('Analytics dashboards require a query bridge supplied via provide / inject.')
  console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
  console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-metric-provider/README.md#requirements')
  queryFn = () => Promise.reject(new Error('Query bridge required'))
} else {
  queryFn = queryBridge.queryFn
}

const analyticsConfigStore = useAnalyticsConfigStore()

// Check if the current org has long enough retention to make a sane trend query.
// If the feature flag is set, trend access is always true.
const hasTrendAccess = computed<boolean>(() => analyticsConfigStore.longRetention)

// Don't attempt to issue a query until we know what we can query for.
const queryReady = computed(() => !analyticsConfigStore.loading && props.queryReady)

const tz = computed(() => {
  if (props.tz) {
    return props.tz
  }

  return (new Intl.DateTimeFormat()).resolvedOptions().timeZone
})

const resolvedDatasource = computed<QueryDatasource>(() => {
  if (props.datasource) {
    return props.datasource
  }

  return 'basic'
})

// Note: the component implicitly assumes the values it feeds to the composables aren't going to change.
// If they do need to change, then the `useMetricCardGoldenSignals` composable, and dependencies,
// needs to be reactive as well.  Ideally, this would be the case; we don't have any guarantee that the
// tier data has finished loading by the time the component mounts, for example.

const timeframe = computed<Timeframe>(() => {
  if (props.overrideTimeframe) {
    // Trust that the host component calculated the timeframe for us.
    return props.overrideTimeframe
  }

  // TODO - I assume we don't want to short-circut and default to 7 days here (?)
  // if (skuFeatureFlag.value) {
  // return TimePeriods.get(TimeframeKeys.SEVEN_DAY)!
  // }

  const retval = hasTrendAccess.value
    ? TimePeriods.get(props.maxTimeframe)
    : TimePeriods.get(TimeframeKeys.ONE_DAY)

  if (!retval) {
    throw new Error('Metrics provider failed to resolve fallback timeframe.')
  }

  return retval
})

const averageLatencies = computed<boolean>(() => {
  if (props.percentileLatency) {
    // This is an override: ignore feature flags and any other considerations.
    return false
  }

  return true
})

const {
  trafficData,
  latencyData,
} = defaultFetcherDefs({
  datasource: resolvedDatasource,
  dimension: props.dimension,
  dimensionFilterValue: props.filterValue,
  additionalFilter: toRef(props, 'additionalFilter'),
  queryReady,
  timeframe,
  tz,
  hasTrendAccess,
  refreshInterval: props.refreshInterval,
  queryFn,
  averageLatencies,
  abortController: props.abortController,
})

provide(METRICS_PROVIDER_KEY, {
  data: {
    traffic: trafficData,
    latency: latencyData,
  },
  description: toRef(() => props.description),
  containerTitle: toRef(() => props.containerTitle),
  hasTrendAccess,
  longCardTitles: props.longCardTitles,
  averageLatencies,
})

</script>

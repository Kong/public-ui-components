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
  type QueryableExploreDimensions,
  type Timeframe,
} from '@kong-ui-public/analytics-utilities'
import { TimePeriods, TimeframeKeys } from '@kong-ui-public/analytics-utilities'
import { METRICS_PROVIDER_KEY, defaultFetcherDefs } from './metricsProviderUtil'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { useAnalyticsConfigStore, SEVEN_DAYS_MS } from '@kong-ui-public/analytics-config-store'

const props = withDefaults(defineProps<{
  maxTimeframe?: TimeframeKeys,
  overrideTimeframe?: Timeframe,
  tz?: string,
  dimension?: QueryableExploreDimensions,
  filterValue?: string,
  additionalFilter?: ExploreFilter[],
  queryReady?: boolean,
  refreshInterval: number,
  longCardTitles?: boolean,
  description?: string,
  abortController?: AbortController,
}>(), {
  maxTimeframe: TimeframeKeys.THIRTY_DAY,
  overrideTimeframe: undefined,
  tz: undefined,
  dimension: undefined,
  filterValue: undefined,
  additionalFilter: undefined,
  queryReady: true,
  longCardTitles: false,
  description: undefined,
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
const analyticsConfig = analyticsConfigStore.getConfig()

// Don't attempt to issue a query until we know what we can query for.
const queryReady = computed(() => analyticsConfig.value !== null && props.queryReady)

const hasTrendAccess = computed(() =>
  analyticsConfig.value !== null &&
  analyticsConfig.value.analytics &&
  analyticsConfig.value.api_analytics_retention_ms > SEVEN_DAYS_MS,
)

const tz = computed(() => {
  if (props.tz) {
    return props.tz
  }

  return (new Intl.DateTimeFormat()).resolvedOptions().timeZone
})

// Note: the component implicitly assumes the values it feeds to the composables aren't going to change.
// If they do need to change, then the `useMetricCardGoldenSignals` composable, and dependencies,
// needs to be reactive as well.  Ideally, this would be the case; we don't have any guarantee that the
// tier data has finished loading by the time the component mounts, for example.

const timeframe = computed(() => {
  if (props.overrideTimeframe) {
    // Trust that the host component calculated the timeframe for us.
    return props.overrideTimeframe
  }

  const retval = hasTrendAccess.value
    ? TimePeriods.get(props.maxTimeframe)
    : TimePeriods.get(TimeframeKeys.ONE_DAY)

  if (!retval) {
    throw new Error('Metrics provider failed to resolve fallback timeframe.')
  }

  return retval
})

const {
  trafficData,
  latencyData,
} = defaultFetcherDefs({
  dimension: props.dimension,
  dimensionFilterValue: props.filterValue,
  additionalFilter: toRef(props, 'additionalFilter'),
  queryReady,
  timeframe,
  tz,
  hasTrendAccess,
  refreshInterval: props.refreshInterval,
  queryFn,
  abortController: props.abortController,
})

provide(METRICS_PROVIDER_KEY, {
  data: {
    traffic: trafficData,
    latency: latencyData,
  },
  description: props.description,
  hasTrendAccess,
  longCardTitles: props.longCardTitles,
})

</script>

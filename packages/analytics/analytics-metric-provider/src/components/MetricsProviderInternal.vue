<template>
  <slot
    :has-trend-access="props.hasTrendAccess"
    :timeframe="timeframe"
  />
</template>
<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import { TimePeriods, Timeframe, TimeframeKeys } from '@kong-ui-public/analytics-utilities'
import { METRICS_PROVIDER_KEY, defaultFetcherDefs } from './metricsProviderUtil'
import { DataFetcher, EXPLORE_V2_DIMENSIONS, ExploreV2Filter } from '../types'

const props = withDefaults(defineProps<{
  maxTimeframe?: TimeframeKeys,
  overrideTimeframe?: Timeframe,
  dimension?: `${EXPLORE_V2_DIMENSIONS}`,
  filterValue?: string,
  additionalFilter?: ExploreV2Filter[],
  queryReady?: boolean,
  dataFetcher: DataFetcher,
  hasTrendAccess: boolean,
  refreshInterval: number,
  longCardTitles?: boolean,
}>(), {
  maxTimeframe: TimeframeKeys.THIRTY_DAY,
  overrideTimeframe: undefined,
  dimension: undefined,
  filterValue: undefined,
  additionalFilter: undefined,
  queryReady: true,
  longCardTitles: false,
})

// Fail early if there's a programming error.
if (props.dimension && !{}.hasOwnProperty.call(EXPLORE_V2_DIMENSIONS, props.dimension)) {
  throw new Error(`Attempted to use MetricsProvider with an invalid dimension: ${props.dimension}`)
}

// Note: the component implicitly assumes the values it feeds to the composables aren't going to change.
// If they do need to change, then the `useMetricCardGoldenSignals` composable, and dependencies,
// needs to be reactive as well.  Ideally, this would be the case; we don't have any guarantee that the
// tier data has finished loading by the time the component mounts, for example.

const timeframe = computed(() => {
  if (props.overrideTimeframe) {
    // Trust that the host component calculated the timeframe for us.
    return props.overrideTimeframe
  }

  const retval = props.hasTrendAccess
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
  dimension: props.dimension as (EXPLORE_V2_DIMENSIONS | undefined),
  dimensionFilterValue: props.filterValue,
  additionalFilter: props.additionalFilter,
  queryReady: toRef(props, 'queryReady'),
  timeframe,
  hasTrendAccess: props.hasTrendAccess,
  refreshInterval: props.refreshInterval,
  dataFetcher: props.dataFetcher,
})

provide(METRICS_PROVIDER_KEY, {
  data: {
    traffic: trafficData,
    latency: latencyData,
  },
  hasTrendAccess: props.hasTrendAccess,
  longCardTitles: props.longCardTitles,
})

</script>

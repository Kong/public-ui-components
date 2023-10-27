<template>
  <slot
    :has-trend-access="props.hasTrendAccess"
    :timeframe="timeframe"
  />
</template>
<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, provide, toRef } from 'vue'
import type { Timeframe } from '@kong-ui-public/analytics-utilities'
import { TimePeriods, TimeframeKeys } from '@kong-ui-public/analytics-utilities'
import { METRICS_PROVIDER_KEY, defaultFetcherDefs } from './metricsProviderUtil'
import { EXPLORE_V2_DIMENSIONS } from '../types'
import type { DataFetcher, ExploreV2Filter } from '../types'
import composables from '../composables'

const { i18n } = composables.useI18n()

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
  description?: string,
}>(), {
  maxTimeframe: TimeframeKeys.THIRTY_DAY,
  overrideTimeframe: undefined,
  dimension: undefined,
  filterValue: undefined,
  additionalFilter: undefined,
  queryReady: true,
  longCardTitles: false,
  description: undefined,
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

// If one of our relative timeframes, we display the requested time frame (if user has trend access); otherwise fall back to one day
// Else, we have a Custom start and end datetime coming from v-calendar, so we display "vs previous X days"
const trendRangeText = computed(() => {
  if (timeframe.value.key === 'custom') {
    return i18n.t('trend.custom', { numDays: Math.ceil(timeframe.value.timeframeLength() / (1000 * 60 * 24)) })
  } else {
    return props.hasTrendAccess
      ? timeframe.value.rangeDisplayText
      : TimePeriods.get(TimeframeKeys.ONE_DAY)?.rangeDisplayText
  }
})

const {
  trafficData,
  latencyData,
} = defaultFetcherDefs({
  dimension: props.dimension as (EXPLORE_V2_DIMENSIONS | undefined),
  dimensionFilterValue: props.filterValue,
  additionalFilter: toRef(props, 'additionalFilter'),
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
  description: props.description,
  hasTrendAccess: props.hasTrendAccess,
  longCardTitles: props.longCardTitles,
  trendRange: trendRangeText as Ref<string>,
})

</script>

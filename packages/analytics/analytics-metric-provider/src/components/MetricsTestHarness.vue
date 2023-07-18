<template>
  <div
    v-if="props.render === 'global'"
    id="global"
  >
    <MetricsProviderInternal v-bind="globalProviderProps">
      <MetricsConsumer />
    </MetricsProviderInternal>
  </div>
  <div
    v-else-if="props.render === 'single'"
    id="single"
  >
    <MetricsProviderInternal v-bind="singleProviderProps">
      <MetricsConsumer />
    </MetricsProviderInternal>
  </div>
  <div
    v-else-if="props.render === 'multi'"
    id="multi"
  >
    <MetricsProviderInternal v-bind="multiProviderProps">
      <div id="route-blah">
        <MetricsConsumer
          :card-size="MetricCardSize.Small"
          lookup-key="blah"
        />
      </div>
      <div id="route-arrgh">
        <MetricsConsumer
          :card-size="MetricCardSize.Small"
          lookup-key="arrgh"
        />
      </div>
    </MetricsProviderInternal>
  </div>
  <div
    v-else-if="props.render === 'latencyCard'"
    id="latencyCard"
  >
    <MetricsProviderInternal v-bind="singleProviderProps">
      <MetricsConsumer :card-to-display="'LATENCY'" />
    </MetricsProviderInternal>
  </div>
</template>
<script setup lang="ts">
import { DataFetcher, ExploreV2Filter, EXPLORE_V2_DIMENSIONS } from '../types'
import MetricsConsumer from './MetricsConsumer.vue'
import MetricsProviderInternal from './MetricsProviderInternal.vue'
import { MetricCardSize } from '@kong-ui-public/metric-cards'

// Allow passing in a mock data fetcher.
const props = withDefaults(defineProps<{
  render: 'global' | 'single' | 'multi' | 'latencyCard',
  dataFetcher: DataFetcher,
  hasTrendAccess: boolean,
  queryReady?: boolean,
  refreshInterval?: number,
  additionalFilter?: ExploreV2Filter[],
  longCardTitles?: boolean,
}>(), {
  refreshInterval: 60 * 1000,
  queryReady: true,
  additionalFilter: undefined,
  longCardTitles: undefined,
})

// Query stats for an entire org, no grouping or filtering.
const globalProviderProps = {
  ...props,
}

// Query stats for a single entity, no grouping.
const singleProviderProps = {
  ...props,
  dimension: EXPLORE_V2_DIMENSIONS.ROUTE,
  filterValue: 'blah',
}

// Query stats for multiple entities.
const multiProviderProps = {
  ...props,
  dimension: EXPLORE_V2_DIMENSIONS.ROUTE,
}

</script>

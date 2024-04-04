<template>
  <div
    v-if="props.render === 'global'"
    id="global"
  >
    <MetricsProvider v-bind="globalProviderProps">
      <MetricsConsumer />
    </MetricsProvider>
  </div>
  <div
    v-else-if="props.render === 'single'"
    id="single"
  >
    <MetricsProvider v-bind="singleProviderProps">
      <MetricsConsumer />
    </MetricsProvider>
  </div>
  <div
    v-else-if="props.render === 'multi'"
    id="multi"
  >
    <MetricsProvider v-bind="multiProviderProps">
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
    </MetricsProvider>
  </div>
  <div
    v-else-if="props.render === 'latencyCard'"
    id="latencyCard"
  >
    <MetricsProvider v-bind="singleProviderProps">
      <MetricsConsumer :card-to-display="'LATENCY'" />
    </MetricsProvider>
  </div>
</template>
<script setup lang="ts">
import MetricsConsumer from './MetricsConsumer.vue'
import MetricsProvider from './MetricsProvider.vue'
import { MetricCardSize } from '@kong-ui-public/metric-cards'
import type { ExploreFilter, QueryableExploreDimensions } from '@kong-ui-public/analytics-utilities'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  render: 'global' | 'single' | 'multi' | 'latencyCard',
  queryReady?: boolean,
  refreshInterval?: number,
  additionalFilter?: ExploreFilter[],
  longCardTitles?: boolean,
  description?: string,
}>(), {
  refreshInterval: 60 * 1000,
  queryReady: true,
  additionalFilter: undefined,
  longCardTitles: undefined,
  description: undefined,
})

// Query stats for an entire org, no grouping or filtering.
const globalProviderProps = computed(() => ({
  ...props,
}))

// Query stats for a single entity, no grouping.
const singleProviderProps = computed(() => ({
  ...props,
  dimension: 'route' as QueryableExploreDimensions,
  filterValue: 'blah',
}))

// Query stats for multiple entities.
const multiProviderProps = computed(() => ({
  ...props,
  dimension: 'route' as QueryableExploreDimensions,
}))

</script>

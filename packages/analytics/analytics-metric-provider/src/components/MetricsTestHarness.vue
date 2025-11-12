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
import { MetricCardSize } from '../enums'
import type { ExploreFilterAll, FilterableExploreDimensions, QueryDatasource, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  render: 'global' | 'single' | 'multi' | 'latencyCard'
  datasource?: QueryDatasource
  queryReady?: boolean
  refreshInterval?: number
  additionalFilter?: ExploreFilterAll[]
  longCardTitles?: boolean
  containerTitle?: string
  description?: string
  percentileLatency?: boolean
  overrideTimeRange?: TimeRangeV4
}>(), {
  refreshInterval: 60 * 1000,
  queryReady: true,
  datasource: undefined,
  additionalFilter: undefined,
  longCardTitles: undefined,
  containerTitle: undefined,
  description: undefined,
  percentileLatency: undefined,
  overrideTimeRange: undefined,
})

// Query stats for an entire org, no grouping or filtering.
const globalProviderProps = computed(() => ({
  ...props,
}))

// Query stats for a single entity, no grouping.
const singleProviderProps = computed(() => ({
  ...props,
  dimension: 'route' as FilterableExploreDimensions,
  filterValue: 'blah',
}))

// Query stats for multiple entities.
const multiProviderProps = computed(() => ({
  ...props,
  dimension: 'route' as FilterableExploreDimensions,
}))

</script>

<template>
  <div class="metric-card-tile-wrapper">
    <MetricsProvider v-bind="options">
      <MetricsConsumer />
    </MetricsProvider>
  </div>
</template>
<script setup lang="ts">
import type { RendererProps } from '../types'
import type { MetricCardOptions, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import { MetricsProvider, MetricsConsumer } from '@kong-ui-public/analytics-metric-provider'
import { computed, type Ref } from 'vue'
import type { ExploreFilterAll } from '@kong-ui-public/analytics-utilities'

// Unlike AnalyticsChart, the metric card package doesn't currently expose its options
// in a convenient interface.
type ProviderProps = InstanceType<typeof MetricsProvider>['$props']

const props = defineProps<RendererProps<MetricCardOptions>>()

const overrideTimeRange: Ref<TimeRangeV4> = computed(() => {
  return props.context.timeSpec
})

const options = computed<ProviderProps>(() => {
  const datasource = props.query?.datasource
  if (datasource && datasource !== 'api_usage' && datasource !== 'basic') {
    throw new Error(`Invalid datasource value: ${datasource}`)
  }
  return {
    datasource: props.query?.datasource,
    overrideTimeRange: overrideTimeRange.value,
    tz: props.context.tz,
    additionalFilter: props.context.filters as ExploreFilterAll[], // TODO: Decide how to handle metric card filters.
    longCardTitles: props.chartOptions.long_card_titles,
    percentileLatency: props.chartOptions.percentile_latency,
    refreshInterval: props.context.refreshInterval,
    queryReady: props.queryReady,
    refreshCounter: props.refreshCounter,
  }
})
</script>

<style scoped lang="scss">
.metric-card-tile-wrapper {
  @media (min-width: ($kui-breakpoint-phablet - 1px)) {
    align-items: center;
    display: flex;
    height: 90%;
  }
}
</style>

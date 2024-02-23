<template>
  <div class="metric-card-tile-wrapper">
    <MetricsProviderInternal v-bind="options">
      <MetricsConsumer class="metric-consumer" />
    </MetricsProviderInternal>
  </div>
</template>
<script setup lang="ts">
import type { MetricCardOptions, RendererProps } from '../types'
import { MetricsProviderInternal, MetricsConsumer } from '@kong-ui-public/analytics-metric-provider'
import { computed } from 'vue'

// Unlike AnalyticsChart, the metric card package doesn't currently expose its options
// in a convenient interface.
type ProviderProps = InstanceType<typeof MetricsProviderInternal>['$props']

const props = defineProps<RendererProps<MetricCardOptions>>()

const options = computed<ProviderProps>(() => ({
  longCardTitles: props.chartOptions.longCardTitles,
  description: props.chartOptions.description,
  hasTrendAccess: true,
  refreshInterval: 0,
}))
</script>

<style scoped lang="scss">
.metric-card-tile-wrapper {
  padding: $kui-space-80;
  @media (min-width: ($kui-breakpoint-phablet - 1px)) {
    align-items: center;
    display: flex;
    height: 100%;
    padding: 0 $kui-space-80;
  }

  :deep(.kong-ui-public-metric-card-container) {
    height: 100%;

    @media (min-width: ($kui-breakpoint-phablet - 1px)) {
      height: 80%;
    }

    .metricscard {
      justify-content: space-evenly;

      @media (min-width: ($kui-breakpoint-phablet - 1px)) {
        &:not(:last-of-type) {
          border-right: $kui-border-width-10 solid $kui-color-border;
        }
      }
    }
  }
}
</style>

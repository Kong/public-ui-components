<template>
  <div class="metric-card-tile-wrapper">
    <MetricsProvider v-bind="options">
      <MetricsConsumer />
    </MetricsProvider>
  </div>
</template>
<script setup lang="ts">
import type { MetricCardOptions, RendererProps } from '../types'
import { MetricsProvider, MetricsConsumer } from '@kong-ui-public/analytics-metric-provider'
import { computed, type Ref } from 'vue'
import { type ExploreFilter, Timeframe, TimePeriods } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

// Unlike AnalyticsChart, the metric card package doesn't currently expose its options
// in a convenient interface.
type ProviderProps = InstanceType<typeof MetricsProvider>['$props']

const props = defineProps<RendererProps<MetricCardOptions>>()

const { evaluateFeatureFlag } = composables.useEvaluateFeatureFlag()
const hasKebabMenuAccess = evaluateFeatureFlag('ma-3043-analytics-chart-kebab-menu', false)


const overrideTimeframe: Ref<Timeframe> = computed(() => {
  // Convert the timeframe to a v4 timespec.
  // Ideally, metric cards would natively support timespecs, but for right now,
  // we're sticking with this interface.
  const timeSpec = props.context.timeSpec
  if (timeSpec.type === 'absolute') {
    return new Timeframe({
      key: 'custom',
      timeframeText: 'custom',
      display: 'custom',
      startCustom: timeSpec.start,
      endCustom: timeSpec.end,
      timeframeLength: () => timeSpec.end.getTime() - timeSpec.start.getTime(),
      defaultResponseGranularity: 'daily',
      dataGranularity: 'daily',
      isRelative: false,
      allowedTiers: ['free', 'plus', 'enterprise'],
    })
  }

  const relativePeriod = TimePeriods.get(timeSpec.time_range)
  if (!relativePeriod) {
    // Should never happen; if it does, at least make it clear what the problem is.
    throw new Error('Unknown time range')
  }

  return relativePeriod
})

const options = computed<ProviderProps>(() => {
  const datasource = props.query?.datasource
  if (datasource && datasource !== 'advanced' && datasource !== 'basic') {
    throw new Error(`Invalid datasource value: ${datasource}`)
  }
  return {
    datasource: props.query?.datasource,
    overrideTimeframe: overrideTimeframe.value,
    tz: props.context.tz,
    additionalFilter: props.context.filters as ExploreFilter[], // TODO: Decide how to handle metric card filters.
    longCardTitles: props.chartOptions.longCardTitles,
    ... !hasKebabMenuAccess && { containerTitle: props.chartOptions.chartTitle },
    ... !hasKebabMenuAccess && { description: props.chartOptions.description },
    percentileLatency: props.chartOptions.percentileLatency,
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
    height: v-bind('hasKebabMenuAccess ? "90%" : "100%"');;
  }

  :deep(.kong-ui-public-metric-card-container) {
    height: v-bind('hasKebabMenuAccess ? "auto" : "100%"');
    max-height: v-bind('hasKebabMenuAccess ? "100%" : "none"');

    .metricscard {
      @media (min-width: ($kui-breakpoint-phablet - 1px)) {
        &:not(:last-of-type) {
          border-right: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
        }
      }
    }
  }
}
</style>

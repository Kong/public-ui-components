<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :limit-override="SANKEY_QUERY_LIMIT"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    :supplied-data="suppliedData"
    @chart-data="emit('chart-data', $event)"
    @query-complete="emit('query-complete')"
  >
    <div
      class="wrapper"
      data-testid="sankey-chart"
    >
      <KEmptyState
        v-if="!isCompatible"
        :action-button-visible="false"
        data-testid="sankey-unsupported"
      >
        <template #title>
          {{ i18n.t('renderer.sankeyUnsupported.title') }}
        </template>
        <template #default>
          {{ i18n.t('renderer.sankeyUnsupported.description') }}
        </template>
      </KEmptyState>
      <SankeyChart
        v-else-if="toChartProps(data)"
        height="100%"
        :tooltip-title="chartOptions.chart_title ?? undefined"
        v-bind="toChartProps(data)"
      />
      <KEmptyState
        v-else
        :action-button-visible="false"
        data-testid="no-data-in-report"
      >
        <template #title>
          {{ i18n.t('renderer.noDataAvailable.title') }}
        </template>
        <template #default>
          {{ i18n.t('renderer.noDataAvailable.description') }}
        </template>
      </KEmptyState>
    </div>
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { ExploreResultV4, InteractionCoordinator, SankeyChartOptions } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'

import { SankeyChart } from '@kong-ui-public/echarts'
import '@kong-ui-public/echarts/dist/style.css'

import { computed, inject } from 'vue'

import composables from '../composables'
import { INJECT_DASHBOARD_COORDINATOR } from '../constants'
import { exploreResultToSankey, isSankeyCompatible, SANKEY_DEFAULT_LIMIT, SANKEY_QUERY_LIMIT } from '../utils/sankey-adapters'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<ChartRendererProps<SankeyChartOptions>>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const metricFormatter = composables.useMetricFormatter()

const isCompatible = computed(() => isSankeyCompatible(props.query.metrics?.[0], props.query.dimensions ?? []))

// The query's `limit` is the top N in each column. The query itself fetches as many rows as
// it can, so the adapter can pick each node's own top values
const limit = computed(() => props.query.limit && props.query.limit > 0 ? props.query.limit : SANKEY_DEFAULT_LIMIT)

// Colors nodes like the dashboard's other charts
const coordinator = inject<InteractionCoordinator | undefined>(INJECT_DASHBOARD_COORDINATOR, undefined)
const chartUuid = crypto.randomUUID()

// Undefined when there are no links, which shows the empty state
const buildChartProps = (result: ExploreResultV4) => {
  const sankey = exploreResultToSankey(result, { limit: limit.value, coordinator: coordinator?.color, chartUuid })

  if (!sankey?.links.length) {
    return undefined
  }

  return {
    nodes: sankey.nodes,
    links: sankey.links,
    ...metricFormatter(result),
  }
}

const chartPropsCache = new WeakMap<ExploreResultV4, ReturnType<typeof buildChartProps>>()

const toChartProps = (result: ExploreResultV4) => {
  if (!chartPropsCache.has(result)) {
    chartPropsCache.set(result, buildChartProps(result))
  }

  return chartPropsCache.get(result)
}
</script>

<style lang="scss" scoped>
.wrapper {
  height: 100%;

  > * {
    height: 100%;
  }
}
</style>

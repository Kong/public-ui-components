<script setup lang="ts">
import type { ExploreResultV4, InteractionCoordinator, SankeyChartOptions, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { SankeyNode } from '@kong-ui-public/echarts'
import type { ChartRendererProps } from '../types'

import { SankeyChart } from '@kong-ui-public/echarts'
import '@kong-ui-public/echarts/dist/style.css'

import { computed, inject, ref, watch } from 'vue'

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

// The selected view's dimensions, and any datasource, metrics or filters it gives, replace the query's
const view = computed(() => props.chartOptions.views?.[props.activeView ?? 0])

/** The first-column value the chart is narrowed to, after clicking its node */
const narrowedTo = ref<{ dimension: string, id: string, name: string }>()

const viewQuery = computed((): ValidDashboardChartQuery => {
  const { datasource, metrics, dimensions, filters } = view.value ?? {}
  const viewFilters = filters ?? props.query.filters
  const narrowedFilters = narrowedTo.value
    ? [...(viewFilters ?? []), { field: narrowedTo.value.dimension, operator: 'in', value: [narrowedTo.value.id] }]
    : viewFilters

  return {
    ...props.query,
    datasource: datasource ?? props.query.datasource,
    metrics: metrics ?? props.query.metrics,
    dimensions: dimensions ?? props.query.dimensions,
    filters: narrowedFilters,
  } as ValidDashboardChartQuery
})

// A narrowed value may not be in the other view's columns
watch(view, () => {
  narrowedTo.value = undefined
})

const isCompatible = computed(() => isSankeyCompatible(viewQuery.value.metrics?.[0], viewQuery.value.dimensions ?? []))

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
    sankey,
    chartProps: {
      nodes: sankey.nodes,
      links: sankey.links,
      ...metricFormatter(result),
    },
  }
}

const chartPropsCache = new WeakMap<ExploreResultV4, ReturnType<typeof buildChartProps>>()

const toChartProps = (result: ExploreResultV4) => {
  if (!chartPropsCache.has(result)) {
    chartPropsCache.set(result, buildChartProps(result))
  }

  return chartPropsCache.get(result)
}

/** Clicking a first-column node narrows the chart to that value */
const onNodeClick = (result: ExploreResultV4, node: SankeyNode): void => {
  const sankey = toChartProps(result)?.sankey
  const id = sankey?.rankedValues.get(node.id)

  if (sankey && id !== undefined) {
    narrowedTo.value = { dimension: sankey.rankedDimension, id, name: node.name }
  }
}
</script>

<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :limit-override="SANKEY_QUERY_LIMIT"
    :query="viewQuery"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
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
      <template v-else-if="toChartProps(data)">
        <SankeyChart
          height="100%"
          :tooltip-title="chartOptions.chart_title ?? undefined"
          v-bind="toChartProps(data)!.chartProps"
          @node-click="onNodeClick(data, $event)"
        />
        <p
          v-if="narrowedTo"
          class="narrowed-to"
          data-testid="sankey-narrowed-to"
        >
          {{ i18n.t('renderer.sankeyNarrowedTo', { name: narrowedTo.name }) }}
          <button
            class="show-all"
            data-testid="sankey-show-all"
            type="button"
            @click="narrowedTo = undefined"
          >
            {{ i18n.t('renderer.sankeyShowAll') }}
          </button>
        </p>
      </template>
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

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;

  > * {
    flex: 1;
    min-height: 0;
  }

  // Centered under the chart
  .narrowed-to {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    flex: none;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    margin: 0;
    text-align: center;
  }

  .show-all {
    background: none;
    border: 0;
    color: var(--kui-color-text, $kui-color-text);
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: underline;
  }
}
</style>

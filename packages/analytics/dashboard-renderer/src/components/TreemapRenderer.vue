<script setup lang="ts">
import type { ExploreResultV4, TreemapChartOptions } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'

import { TreeMapChart } from '@kong-ui-public/echarts'
import '@kong-ui-public/echarts/dist/style.css'

import { computed } from 'vue'

import composables from '../composables'
import { exploreResultToTreemap, isTreemapCompatible } from '../utils/treemap-adapters'
import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<ChartRendererProps<TreemapChartOptions>>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const metricFormatter = composables.useMetricFormatter()

const isCompatible = computed(() => isTreemapCompatible(props.query.metrics?.[0], props.query.dimensions ?? []))

// Undefined when there are no nodes, which shows the empty state
const buildChartProps = (result: ExploreResultV4) => {
  const treemap = exploreResultToTreemap(result, { otherLabel: i18n.t('chartLabels.____OTHER____') })

  if (!treemap?.length) {
    return undefined
  }

  return {
    data: treemap,
    // Drill down is only useful when a second dimension nests under the first
    drillDown: treemap.some((node) => node.children?.length),
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

<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    @chart-data="emit('chart-data', $event)"
    @query-complete="emit('query-complete')"
  >
    <div
      class="wrapper"
      data-testid="treemap-chart"
    >
      <KEmptyState
        v-if="!isCompatible"
        :action-button-visible="false"
        data-testid="treemap-unsupported"
      >
        <template #title>
          {{ i18n.t('renderer.treemapUnsupported.title') }}
        </template>
        <template #default>
          {{ i18n.t('renderer.treemapUnsupported.description') }}
        </template>
      </KEmptyState>
      <TreeMapChart
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

<style lang="scss" scoped>
.wrapper {
  height: 100%;

  > * {
    height: 100%;
  }
}
</style>

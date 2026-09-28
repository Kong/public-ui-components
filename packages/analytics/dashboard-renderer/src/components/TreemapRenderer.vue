<script setup lang="ts">
import type { ExploreResultV4, TreemapChartOptions } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'

import { TreeMapChart } from '@kong-ui-public/echarts'
import '@kong-ui-public/echarts/dist/style.css'

import { computed, ref } from 'vue'

import composables from '../composables'
import { exploreResultToTreemap } from '../utils/treemap-adapters'
import QueryDataProvider from './QueryDataProvider.vue'

defineProps<ChartRendererProps<TreemapChartOptions>>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const metricFormatter = composables.useMetricFormatter()

// Kept from chart-data rather than the slot so the chart props can be a computed
const exploreResult = ref<ExploreResultV4>()

const onChartData = (chartData: ExploreResultV4) => {
  exploreResult.value = chartData
  emit('chart-data', chartData)
}

// Undefined when there are no nodes, which shows the empty state
const toChartProps = (result: ExploreResultV4) => {
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

const chartProps = computed(() => exploreResult.value && toChartProps(exploreResult.value))
</script>

<template>
  <QueryDataProvider
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
    @chart-data="onChartData"
    @query-complete="emit('query-complete')"
  >
    <div
      class="wrapper"
      data-testid="treemap-chart"
    >
      <TreeMapChart
        v-if="chartProps"
        height="100%"
        :tooltip-title="chartOptions.chart_title ?? undefined"
        v-bind="chartProps"
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

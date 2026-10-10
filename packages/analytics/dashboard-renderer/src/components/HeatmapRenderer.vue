<script setup lang="ts">
import type { ExploreResultV4, HeatmapChartOptions } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'

import { HeatmapChart } from '@kong-ui-public/echarts'
import '@kong-ui-public/echarts/dist/style.css'

import composables from '../composables'
import { exploreResultToHeatmap } from '../utils/heatmap-adapters'
import QueryDataProvider from './QueryDataProvider.vue'

const VISIBLE_ROWS = 10

defineProps<ChartRendererProps<HeatmapChartOptions>>()

const emit = defineEmits<{
  (e: 'chart-data', chartData: ExploreResultV4): void
  (e: 'query-complete'): void
}>()

const { i18n } = composables.useI18n()
const metricFormatter = composables.useMetricFormatter()

// Undefined when there are no cells, which shows the empty state
const buildChartProps = (result: ExploreResultV4) => {
  const heatmap = exploreResultToHeatmap(result)

  if (!heatmap?.data.length) {
    return undefined
  }

  return {
    data: heatmap.data,
    xAxisLabels: heatmap.xAxisLabels,
    yAxisLabels: heatmap.yAxisLabels,
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
      data-testid="heatmap-chart"
    >
      <HeatmapChart
        v-if="toChartProps(data)"
        height="100%"
        :tooltip-title="chartOptions.chart_title ?? undefined"
        :visible-rows="VISIBLE_ROWS"
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

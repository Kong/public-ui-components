<script setup lang="ts">
import type { TopTalkersGridColumn } from '@kong-ui-public/analytics-chart'
import type { TopTalkersOptions, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'

import { computed } from 'vue'
import { TopTalkersColumn, TopTalkersGrid } from '@kong-ui-public/analytics-chart'

import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<ChartRendererProps<TopTalkersOptions>>()

const columns = computed((): TopTalkersGridColumn[] => {
  return props.chartOptions.columns.map((column) => ({
    dimension: column.dimension,
    label: column.label,
  }))
})

const queryForDimension = (dimension: string): ValidDashboardChartQuery => {
  return {
    ...props.query,
    dimensions: [dimension],
  } as ValidDashboardChartQuery
}
</script>

<template>
  <TopTalkersGrid
    :column-options="chartOptions.column_options"
    :columns="columns"
    :size-metric="chartOptions.size_metric"
    :title="chartOptions.chart_title"
  >
    <template #column="{ column }">
      <QueryDataProvider
        v-slot="{ data }"
        :context="context"
        :query="queryForDimension(column.dimension)"
        :query-ready="queryReady"
        :refresh-counter="refreshCounter"
      >
        <TopTalkersColumn
          :column-options="chartOptions.column_options"
          :data="data"
          :dimension="column.dimension"
          :label="column.label"
          :size-metric="chartOptions.size_metric"
        />
      </QueryDataProvider>
    </template>
  </TopTalkersGrid>
</template>

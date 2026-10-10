<script setup lang="ts">
import type { TopTalkersGridColumn } from '@kong-ui-public/analytics-chart'
import type { TopTalkersColumnDefinition, TopTalkersOptions, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { ChartRendererProps } from '../types'

import { computed, watch } from 'vue'
import { TopTalkersColumn, TopTalkersGrid } from '@kong-ui-public/analytics-chart'

import QueryDataProvider from './QueryDataProvider.vue'

const props = defineProps<ChartRendererProps<TopTalkersOptions>>()

const emit = defineEmits<{
  (e: 'query-complete'): void
}>()

const columns = computed((): TopTalkersGridColumn[] => {
  return props.chartOptions.columns.map((column) => ({
    dimension: column.dimension,
    label: column.label,
  }))
})

const queryForColumn = (column: TopTalkersColumnDefinition): ValidDashboardChartQuery => {
  return {
    ...props.query,
    dimensions: [column.dimension],
    // The query filters apply to every column, and the column filters narrow them further.
    filters: [...(props.query.filters ?? []), ...(column.filters ?? [])],
  } as ValidDashboardChartQuery
}

const columnQueries = computed((): Map<TopTalkersGridColumn, ValidDashboardChartQuery> => {
  return new Map(columns.value.map((column, index) => [column, queryForColumn(props.chartOptions.columns[index])]))
})

const completedColumns = new Set<TopTalkersGridColumn>()

const onColumnQueryComplete = (column: TopTalkersGridColumn) => {
  completedColumns.add(column)

  if (completedColumns.size === columns.value.length) {
    completedColumns.clear()
    emit('query-complete')
  }
}

watch([columnQueries, () => props.refreshCounter], () => completedColumns.clear())
</script>

<template>
  <TopTalkersGrid
    :column-options="chartOptions.column_options"
    :columns="columns"
    :size-metric="chartOptions.size_metric"
  >
    <template #column="{ column }">
      <QueryDataProvider
        v-slot="{ data }"
        :context="context"
        :query="columnQueries.get(column)!"
        :query-ready="queryReady"
        :refresh-counter="refreshCounter"
        @query-complete="onColumnQueryComplete(column)"
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

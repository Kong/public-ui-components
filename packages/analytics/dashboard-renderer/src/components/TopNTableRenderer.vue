<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  >
    <TopNDataGrid
      :chart-options="chartOptions"
      :data="data"
      :fit-to-content="fitToContent"
      :height="height"
    />
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { ChartRendererProps } from '../types'
import type { TopNTableOptions } from '@kong-ui-public/analytics-utilities'
import QueryDataProvider from './QueryDataProvider.vue'
import TopNDataGrid from './TopNDataGrid.vue'

defineProps<ChartRendererProps<TopNTableOptions> & { fitToContent?: boolean }>()
</script>

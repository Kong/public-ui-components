<template>
  <QueryDataProvider
    v-slot="{ data }"
    :context="context"
    :query="query"
    :query-ready="queryReady"
  >
    <TopNTable
      :data="data"
      :description="chartOptions.description"
      no-border
      :synthetics-data-key="chartOptions.syntheticsDataKey"
      :title="chartOptions.chartTitle || ''"
    />
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps, TopNTableOptions } from '../types'
import { TopNTable } from '@kong-ui-public/analytics-chart'
import QueryDataProvider from './QueryDataProvider.vue'

defineProps<RendererProps<TopNTableOptions>>()

</script>

<template>
  <QueryDataProvider
    :context="context"
    :query="query"
    :query-ready="queryReady"
    :refresh-counter="refreshCounter"
  >
    <!-- <div
      class="analytics-chart"
      :class="{ 'single-value': isSingleValueChart }"
    >
      <SimpleChart
        :chart-data="data"
        :chart-options="chartOptions"
        :synthetics-data-key="isSingleValueChart ? undefined : (chartOptions as GaugeChartOptions).synthetics_data_key"
      />
    </div> -->
  </QueryDataProvider>
</template>

<script setup lang="ts">
import type { RendererProps } from '../types'
import type { GaugeChartOptions, SingleValueOptions } from '@kong-ui-public/analytics-utilities'
import QueryDataProvider from './QueryDataProvider.vue'
defineProps<RendererProps<GaugeChartOptions | SingleValueOptions>>()

</script>

<template>
  <QueryDataProvider
    v-slot="{ data }"
    :query="props.query"
    :query-ready="props.queryReady"
  >
    Stub: {{ chartType }}
    <pre>
      {{ queryResult(data) }}
    </pre>
  </QueryDataProvider>
</template>
<script setup lang="ts">
import type { BarChartOptions, RendererProps } from '../types'
import QueryDataProvider from './QueryDataProvider.vue'
import { computed } from 'vue'

const props = defineProps<RendererProps<BarChartOptions>>()

// Temp: show _something_.
const chartType = computed(() => props.chartOptions.type)
const queryResult = (data: any) => JSON.stringify(data, undefined, '  ').substring(0, 500)

</script>

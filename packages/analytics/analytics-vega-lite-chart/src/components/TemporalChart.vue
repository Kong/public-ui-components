<template>
  <BaseVegaLiteChart
    ref="baseChartRef"
    :spec="spec"
  />
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue'
import BaseVegaLiteChart from './BaseVegaLiteChart.vue'
import { createTimeSeriesVegaSpec } from '../utils'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

const props = withDefaults(defineProps<{
  data: ExploreResultV4
  chartType?: 'timeseries_line' | 'timeseries_bar' | 'timeseries_area'
}>(), {
  chartType: 'timeseries_line',
})

const analyticsChartTypeToVegaChartType = {
  timeseries_line: 'line',
  timeseries_bar: 'bar',
  timeseries_area: 'area',
} as const

const spec = computed(() => createTimeSeriesVegaSpec(props.data, analyticsChartTypeToVegaChartType[props.chartType]))

</script>

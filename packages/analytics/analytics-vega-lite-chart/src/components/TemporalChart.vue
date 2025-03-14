<template>
  <BaseVegaLiteChart
    ref="baseChartRef"
    :data="chartData"
    :spec="spec"
  />
</template>

<script setup lang="ts">
import { computed, defineProps, toRaw } from 'vue'
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

// Changes to chart type should generatea new spec but not data
// Data can be updated without re-embedding the entire chart
const data = toRaw(props.data)
const chartData = computed(() => props.data)
const spec = computed(() => createTimeSeriesVegaSpec(data, analyticsChartTypeToVegaChartType[props.chartType]))

</script>

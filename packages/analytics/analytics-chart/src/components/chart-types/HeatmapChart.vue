<script setup lang="ts">
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { computed } from 'vue'
import { HeatmapChart as EChartsHeatmap } from '@kong-ui-public/echarts'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'

import composables from '../../composables'
import { exploreResultToHeatmap } from '../../utils/heatmap-adapters'
import '@kong-ui-public/echarts/dist/style.css'

const VISIBLE_ROWS = 10

const {
  chartData,
  metricUnit = '',
  tooltipMetricDisplay,
  tooltipTitle,
} = defineProps<{
  chartData: ExploreResultV4
  metricUnit?: string
  tooltipMetricDisplay?: string
  tooltipTitle?: string
}>()

const { i18n } = composables.useI18n()
const { translateUnit } = composables.useTranslatedUnits()
const { formatUnit } = unitFormatter({ i18n })

const heatmapData = computed(() => exploreResultToHeatmap(chartData))

const valueFormatter = (value: number): string => formatUnit(value, metricUnit, { translateUnit }).trim()
</script>

<template>
  <div
    class="heatmap-chart"
    data-testid="heatmap-chart"
  >
    <EChartsHeatmap
      v-if="heatmapData"
      :data="heatmapData.data"
      height="100%"
      :series-name="tooltipMetricDisplay"
      :tooltip-title="tooltipTitle || undefined"
      :value-formatter="valueFormatter"
      :visible-rows="VISIBLE_ROWS"
      :x-axis-labels="heatmapData.xAxisLabels"
      :y-axis-labels="heatmapData.yAxisLabels"
    />
  </div>
</template>

<style lang="scss" scoped>
.heatmap-chart {
  height: 100%;
  width: 100%;

  > * {
    height: 100%;
  }
}
</style>

<script setup lang="ts">
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { computed } from 'vue'
import { TreeMapChart as EChartsTreeMap } from '@kong-ui-public/echarts'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'

import composables from '../../composables'
import { exploreResultToTreemap } from '../../utils/treemap-adapters'
import '@kong-ui-public/echarts/dist/style.css'

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

const treemapData = computed(() => exploreResultToTreemap(chartData))

const hasGroups = computed(() => !!treemapData.value?.some((node) => node.children?.length))

const valueFormatter = (value: number): string => formatUnit(value, metricUnit, { translateUnit }).trim()
</script>

<template>
  <div
    class="treemap-chart"
    data-testid="treemap-chart"
  >
    <EChartsTreeMap
      v-if="treemapData"
      :data="treemapData"
      :drill-down="hasGroups"
      height="100%"
      :series-name="tooltipMetricDisplay"
      :tooltip-title="tooltipTitle || undefined"
      :value-formatter="valueFormatter"
    />
  </div>
</template>

<style lang="scss" scoped>
.treemap-chart {
  height: 100%;
  width: 100%;

  > * {
    height: 100%;
  }
}
</style>

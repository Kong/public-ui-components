<template>
  <BaseAnalyticsEcharts
    :option="option"
    :render-mode="renderMode"
    :theme="theme"
    :tooltip-state="tooltipState"
  />
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import type { TooltipState } from './ChartTooltip.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'

const {
  data,
  type,
  stacked = false,
  colorPalette = undefined,
  theme = 'light',
  renderMode = 'svg',
} = defineProps<{
  data: ExploreResultV4
  type: 'horizontal_bar' | 'vertical_bar' | 'donut'
  stacked?: boolean
  colorPalette?: string[] | Record<string, string>
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const tooltipState = ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const { option } = composables.useExploreResultToEChartCrossSectional({
  exploreResult: toRef(() => data),
  chartType: toRef(() => type),
  stacked: toRef(() => stacked),
  colorPalette: toRef(() => colorPalette),
  tooltipState,
})
</script>

<template>
  <BaseAnalyticsEcharts
    ref="baseChart"
    :option="option"
    :render-mode="renderMode"
    :theme="theme"
    @click="handleSeriesClick"
    @zr:click="handleClick"
    @zr:mousemove="handleMouseMove"
    @zr:mouseout="handleMouseOut"
  >
    <ChartTooltip
      ref="tooltip"
      :state="tooltipState"
    />
  </BaseAnalyticsEcharts>
</template>

<script setup lang="ts">
import { computed, ref, toRef, useTemplateRef } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { useElementSize, useElementBounding } from '@vueuse/core'
import composables from '../composables'
import type { TooltipState } from './ChartTooltip.vue'
import ChartTooltip from './ChartTooltip.vue'
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

const baseChartRef = useTemplateRef('baseChart')
const tooltipRef = useTemplateRef('tooltip')

const chartRef = computed(() => baseChartRef.value?.chart)
const containerRef = computed(() => baseChartRef.value?.container)
const chartEl = computed(() => chartRef.value?.$el as HTMLElement | undefined)

const { width: chartWidth, height: chartHeight } = useElementSize(chartEl)
const { top: containerTop, left: containerLeft } = useElementBounding(containerRef)

const tooltipWidth = computed(() => tooltipRef.value?.width)
const tooltipHeight = computed(() => tooltipRef.value?.height)

const isInteractive = computed(() => tooltipState.value.interactionMode === 'interactive')

const { option } = composables.useExploreResultToEChartCrossSectional({
  exploreResult: toRef(() => data),
  chartType: toRef(() => type),
  stacked: toRef(() => stacked),
  colorPalette: toRef(() => colorPalette),
  tooltipState,
})

const { calculatePosition } = composables.useTooltipPosition({
  chartWidth,
  chartHeight,
  containerTop,
  containerLeft,
  tooltipWidth,
  tooltipHeight,
})

const handleMouseMove = (e: any) => {
  if (!isInteractive.value) {
    const pos = calculatePosition(e)
    if (pos) {
      tooltipState.value.left = pos.left
      tooltipState.value.top = pos.top
    }
  }
}

const handleSeriesClick = (params: any) => {
  if (params.componentType === 'series') {
    chartRef.value?.dispatchAction({
      type: 'toggleSelect',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    })
  }
}

const handleClick = () => {
  if (tooltipState.value.interactionMode !== 'idle') {
    tooltipState.value.interactionMode = 'idle'
    tooltipState.value.visible = false
  } else {
    tooltipState.value.interactionMode = 'interactive'
  }
}

const handleMouseOut = () => {
  if (!isInteractive.value) {
    tooltipState.value.visible = false
  }
}
</script>

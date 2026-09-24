<template>
  <ECharts
    :height="height"
    :option="mergedOption"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { VisualMapComponent } from 'echarts/components'
import ECharts from '../ECharts.vue'
import { useChartColors } from '../../composables/useChartColors.ts'
import { deepMerge } from '../../utils/deepMerge.ts'
import type { EChartsOption } from 'echarts'
import type { HeatmapChartProps } from '../../types/index.ts'

// The renderer, grid and tooltip are registered by the base `ECharts` component
use([HeatmapChart, VisualMapComponent])

const {
  option,
  height,
  data,
  xAxisLabels,
  yAxisLabels,
  seriesName,
  min,
  max,
  colorRange,
} = defineProps<HeatmapChartProps>()

const colors = useChartColors()

const generatedOption = computed((): EChartsOption => {
  const seriesData = data ?? []

  return {
    tooltip: {
      position: 'top',
    },
    grid: {
      top: 10,
      left: 10,
      right: 20,
      bottom: 70,
      // Replaces the deprecated `containLabel: true`: shrink the grid so long
      // y-axis labels aren't clipped, instead of a fixed `left`.
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    xAxis: {
      type: 'category',
      data: xAxisLabels ?? [],
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: yAxisLabels ?? [],
      // List rows top-down in `yAxisLabels` order (category y-axes go bottom-up by default)
      inverse: true,
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      // Truncate long row names with an ellipsis so they don't squeeze the grid
      axisLabel: { width: 160, overflow: 'truncate' },
    },
    visualMap: {
      min: min ?? 0,
      max: max ?? seriesData.reduce((acc, [, , value]) => Math.max(acc, value), 1),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: colorRange ?? [colors.value.KUI_COLOR_BACKGROUND_INFO_WEAKEST, colors.value.KUI_COLOR_BACKGROUND_INFO_STRONG],
      },
    },
    series: [
      {
        name: seriesName,
        type: 'heatmap',
        data: seriesData,
        label: { show: false },
        itemStyle: {
          borderColor: colors.value.KUI_COLOR_BACKGROUND,
          borderWidth: 2,
          borderRadius: 2,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 5,
            shadowColor: colors.value.KUI_COLOR_BACKGROUND_OVERLAY,
          },
        },
      },
    ],
  }
})

// `option` always deep-merges over the generated option. Arrays (including `series`) replace
const mergedOption = computed(() => deepMerge(generatedOption.value, option))
</script>

<template>
  <ECharts
    :height="height"
    :option="mergedOption"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import ECharts from '../ECharts.vue'
import { useChartColors } from '../../composables/useChartColors.ts'
import { deepMerge } from '../../utils/deepMerge.ts'
import type { EChartsOption } from 'echarts'
import type { HeatmapChartProps } from '../../types/index.ts'

use([CanvasRenderer, HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent])

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
  tooltipFormatter,
} = defineProps<HeatmapChartProps>()

const colors = useChartColors()

const generatedOption = computed((): EChartsOption => {
  const seriesData = data ?? []

  return {
    tooltip: {
      position: 'top',
      ...(tooltipFormatter ? { formatter: tooltipFormatter } : {}),
    },
    grid: {
      top: 40,
      left: 50,
      right: 20,
      bottom: 100,
      height: 140,
    },
    xAxis: {
      type: 'category',
      data: xAxisLabels ?? [],
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { interval: 0 },
    },
    yAxis: {
      type: 'category',
      data: yAxisLabels ?? [],
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    visualMap: {
      min: min ?? 0,
      max: max ?? Math.max(1, ...seriesData.map(([, , value]) => value)),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
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

const mergedOption = computed(() => (
  option
    ? (data ? deepMerge(generatedOption.value, option) : option)
    : generatedOption.value
))
</script>

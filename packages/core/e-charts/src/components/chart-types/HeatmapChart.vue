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
import { mergeChartOption } from '../../utils/mergeChartOption.ts'
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
  valueFormatter,
  tooltipFormatter,
} = defineProps<HeatmapChartProps>()

const colors = useChartColors()

const generatedOption = computed((): EChartsOption => {
  const seriesData = data ?? []
  const visualMapFormatter = valueFormatter ? (value: unknown) => valueFormatter(Number(value)) : undefined

  return {
    tooltip: {
      position: 'top',
      formatter: tooltipFormatter,
      valueFormatter: valueFormatter ? (value) => valueFormatter(Number(value)) : undefined,
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
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
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
      formatter: visualMapFormatter,
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

// `option` always deep-merges over the generated option, with `series` merged by index
const mergedOption = computed(() => mergeChartOption(generatedOption.value, option))
</script>

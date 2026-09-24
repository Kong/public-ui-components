<template>
  <ECharts
    :height="height"
    :option="mergedOption"
    :tooltip-content="cellTooltipContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { DataZoomSliderComponent, VisualMapComponent } from 'echarts/components'
import ECharts from '../ECharts.vue'
import { useChartColors } from '../../composables/useChartColors.ts'
import { deepMerge } from '../../utils/deepMerge.ts'
import { categoryLabel, tooltipItems, tooltipRow } from '../../utils/tooltip.ts'
import type { DataZoomComponentOption, EChartsOption, HeatmapSeriesOption } from 'echarts'
import type { ChartTooltipContent, HeatmapChartProps, HeatmapDataPoint } from '../../types/index.ts'

// The renderer, grid and tooltip are registered by the base `ECharts` component
use([HeatmapChart, VisualMapComponent, DataZoomSliderComponent])

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
  visibleRows,
  showValues,
  seriesOption,
  tooltipTitle,
} = defineProps<HeatmapChartProps>()

const colors = useChartColors()

/** Tooltip content, like the analytics-chart tooltips: the column and the series name as the subtitle, and a row for the cell. */
const cellTooltipContent: ChartTooltipContent = (params) => {
  const [cell] = tooltipItems(params)
  const [x, y, value] = cell.value as HeatmapDataPoint

  return {
    title: tooltipTitle,
    context: categoryLabel(x, xAxisLabels),
    metric: seriesName,
    rows: [tooltipRow(cell, categoryLabel(y, yAxisLabels), value, valueFormatter)],
  }
}

/**
 * Scrollbar for `visibleRows`: a slider locked to a fixed-size window of rows,
 * so it can be dragged but not resized. ECharts has no built-in axis
 * scrollbar, so the slider's zoom UI is hidden to make it look like one.
 */
const rowScrollbar = (rows: number): DataZoomComponentOption => ({
  type: 'slider',
  yAxisIndex: 0,
  startValue: 0,
  endValue: rows - 1,
  zoomLock: true,
  right: 10,
  width: 8,
  // Hide the zoom UI: resize handles, move bar, value labels, range brushing, data preview
  handleSize: 0,
  moveHandleSize: 0,
  showDetail: false,
  brushSelect: false,
  showDataShadow: false,
  // A neutral thumb on a borderless track
  borderColor: 'transparent',
  backgroundColor: colors.value.KUI_COLOR_BACKGROUND_NEUTRAL_WEAKEST,
  fillerColor: colors.value.KUI_COLOR_BACKGROUND_NEUTRAL_WEAK,
})

const generatedOption = computed((): EChartsOption => {
  const seriesData = data ?? []
  // Only add the scrollbar when there are more rows than fit
  const scrollRows = !!visibleRows && visibleRows < (yAxisLabels?.length ?? 0)
  const visualMapFormatter = valueFormatter ? (value: unknown) => valueFormatter(Number(value)) : undefined

  return {
    grid: {
      top: 10,
      left: 10,
      // Make room for the row scrollbar
      right: scrollRows ? 30 : 20,
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
      formatter: visualMapFormatter,
    },
    ...(scrollRows ? { dataZoom: [rowScrollbar(visibleRows!)] } : {}),
    series: [
      deepMerge<HeatmapSeriesOption>({
        name: seriesName,
        type: 'heatmap',
        data: seriesData,
        // Prevent flickering of labels by disabling animation
        // The heatmap redraws every cell on each update (scrolling, data refresh, theme
        // change), which replays the label fade-in and makes the labels flicker
        animation: false,
        label: {
          // ECharts picks a light or dark text color for each cell's background
          show: showValues ?? false,
          formatter: valueFormatter ? ({ value }) => valueFormatter(Number((value as HeatmapDataPoint)[2])) : undefined,
        },
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
      }, seriesOption),
    ],
  }
})

// `option` always deep-merges over the generated option. Arrays (including
// `series`) replace, so series tweaks go through `seriesOption` instead
const mergedOption = computed(() => deepMerge(generatedOption.value, option))
</script>

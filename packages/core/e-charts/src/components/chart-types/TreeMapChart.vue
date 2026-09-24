<template>
  <ECharts
    :height="height"
    :option="mergedOption"
    :tooltip-content="nodeTooltipContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import ECharts from '../ECharts.vue'
import { useChartColors } from '../../composables/useChartColors.ts'
import { deepMerge } from '../../utils/deepMerge.ts'
import { tooltipItems, tooltipRow } from '../../utils/tooltip.ts'
import type { EChartsOption, TreemapSeriesOption } from 'echarts'
import type { ChartTooltipContent, TreeMapChartProps } from '../../types/index.ts'

// The renderer, grid and tooltip are registered by the base `ECharts` component.
// The breadcrumb is part of the treemap series, not a separate component
use([TreemapChart])

const {
  option,
  height,
  data,
  seriesName,
  showValues,
  colorPalette,
  valueFormatter,
  leafDepth,
  seriesOption,
  tooltipTitle,
} = defineProps<TreeMapChartProps>()

const colors = useChartColors()

/** Tooltip content: the hovered node's name and its value (formatted with `valueFormatter`). */
const nodeTooltipContent: ChartTooltipContent = (params) => {
  const [node] = tooltipItems(params)

  return {
    title: tooltipTitle,
    rows: [tooltipRow(node, node.name, Number(node.value), valueFormatter)],
  }
}

/** One categorical color per top-level group, all light enough for dark text. */
const defaultPalette = () => [
  colors.value.KUI_COLOR_BACKGROUND_PRIMARY_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_WARNING_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_DANGER_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_INFO_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  colors.value.KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
]

const generatedOption = computed((): EChartsOption => ({
  series: [
    deepMerge<TreemapSeriesOption>({
      name: seriesName,
      type: 'treemap',
      data: data ?? [],
      // ECharts cycles the palette when there are more groups than colors
      color: colorPalette ?? defaultPalette(),
      nodeClick: 'zoomToNode',
      ...(leafDepth ? { leafDepth } : {}),
      // Fill the chart area: ECharts otherwise reserves `top`/`bottom` space
      // for a breadcrumb bar even when it never shows
      left: 0,
      top: 0,
      right: 0,
      // Reserve room for the breadcrumb, which slides in at the bottom when drilled down
      bottom: leafDepth ? 40 : 0,
      // Draw even tiny nodes: ECharts leaves a node's area blank when it falls
      // under the default threshold, which reads as dead space on dense charts
      visibleMin: 0,
      breadcrumb: {
        show: true,
        itemStyle: {
          color: colors.value.KUI_COLOR_BACKGROUND_NEUTRAL_WEAK,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 2,
          textStyle: {
            color: colors.value.KUI_COLOR_TEXT,
          },
        },
        emphasis: {
          itemStyle: {
            color: colors.value.KUI_COLOR_BACKGROUND_NEUTRAL,
            textStyle: {
              color: colors.value.KUI_COLOR_TEXT,
            },
          },
        },
      },
      levels: [
        // Top-level groups: a gap between groups on the page background.
        // No `upperLabel` by default: the strip it reserves renders empty when
        // a group is too short for the text, so group names come from the
        // tooltip instead. Add one via `seriesOption` for tall charts
        {
          itemStyle: {
            borderColor: colors.value.KUI_COLOR_BACKGROUND,
            borderWidth: 2,
            gapWidth: 2,
          },
        },
        // Deeper levels: children inherit the group hue with varied saturation
        {
          colorSaturation: [0.3, 0.5],
          itemStyle: {
            borderColor: colors.value.KUI_COLOR_BACKGROUND,
            borderWidth: 1,
            gapWidth: 1,
          },
        },
      ],
      label: {
        show: true,
        color: colors.value.KUI_COLOR_TEXT,
        align: 'center',
        verticalAlign: 'middle',
        overflow: 'truncate',
        // Boolean props default to `false` when absent, so an explicit `false`
        // is indistinguishable from not passing `showValues`
        formatter: showValues || valueFormatter
          ? ({ name, value }) => {
            const formatted = valueFormatter ? valueFormatter(Number(value)) : String(value)
            return showValues ? `${name}\n${formatted}` : name
          }
          : undefined,
      },
    }, seriesOption),
  ],
}))

// `option` always deep-merges over the generated option. Arrays (including
// `series`) replace, so series tweaks go through `seriesOption` instead
const mergedOption = computed(() => deepMerge(generatedOption.value, option))
</script>

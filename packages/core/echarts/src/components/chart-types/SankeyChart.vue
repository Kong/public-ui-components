<template>
  <ECharts
    :height="height"
    :option="mergedOption"
    :tooltip-content="flowTooltipContent"
    @click="onClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { SankeyChart } from 'echarts/charts'
import ECharts from '../ECharts.vue'
import { useChartColors } from '../../composables/useChartColors.ts'
import { deepMerge } from '../../utils/deepMerge.ts'
import { tooltipItems, tooltipRow } from '../../utils/tooltip.ts'
import type { EChartsOption, SankeySeriesOption } from 'echarts'
import type { ChartTooltipContent, SankeyChartProps, SankeyLink, SankeyNode } from '../../types/index.ts'

// The renderer, grid and tooltip are registered by the base `ECharts` component
use([SankeyChart])

const {
  option,
  height,
  nodes,
  links,
  seriesName,
  showValues,
  valueFormatter,
  colorPalette,
  linkColor = 'source',
  seriesOption,
  tooltipTitle,
} = defineProps<SankeyChartProps>()

const emit = defineEmits<{
  'node-click': [node: SankeyNode]
}>()

const colors = useChartColors()

/**
 * Categorical node colors, strong enough for the faded links to stay visible.
 * No primary colors: some themes make them neutral grays.
 */
const defaultPalette = () => [
  colors.value.KUI_COLOR_BACKGROUND_INFO_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_WARNING_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_DANGER_WEAK,
  colors.value.KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE,
  colors.value.KUI_COLOR_BACKGROUND_INFO_STRONG,
  colors.value.KUI_COLOR_BACKGROUND_SUCCESS,
]

/**
 * Nodes with a color each: their own `itemStyle.color`, or the next palette color.
 * ECharts doesn't cycle a palette over sankey nodes: it maps a series `color` list
 * to node values like a gradient, so the colors are set on the nodes here.
 */
const coloredNodes = computed((): SankeyNode[] => {
  const palette = colorPalette?.length ? colorPalette : defaultPalette()

  return (nodes ?? []).map((node, index) => (node.itemStyle?.color
    ? node
    : { ...node, itemStyle: { ...node.itemStyle, color: palette[index % palette.length] } }))
})

const nodesById = computed(() => new Map(coloredNodes.value.map((node) => [node.id, node])))

const nodeName = (id: string): string => nodesById.value.get(id)?.name ?? id

/**
 * Tooltip content: a link shows its source node as the subtitle and a row for
 * its target, a node shows a row with its total (the larger of its in- and outflow).
 */
const flowTooltipContent: ChartTooltipContent = (params) => {
  const [item] = tooltipItems(params)

  if (item.dataType === 'edge') {
    const { source, target, value } = item.data as SankeyLink
    const sourceColor = nodesById.value.get(source)?.itemStyle?.color

    return {
      title: tooltipTitle,
      context: nodeName(source),
      metric: seriesName,
      rows: [{
        ...tooltipRow(item, nodeName(target), value, valueFormatter),
        // ECharts gives links no color of their own, so use their source node's
        color: typeof sourceColor === 'string' ? sourceColor : undefined,
      }],
    }
  }

  // `item.name` is the node's `id`, the label is on its data
  return {
    title: tooltipTitle,
    metric: seriesName,
    rows: [tooltipRow(item, (item.data as SankeyNode).name, item.value, valueFormatter)],
  }
}

/** Emits the clicked node, with the `id` and `name` it was given */
const onClick = (params: { dataType?: string, data?: unknown }): void => {
  if (params.dataType === 'node') {
    const { id } = params.data as SankeyNode
    const node = nodes?.find((node) => node.id === id)

    if (node) {
      emit('node-click', node)
    }
  }
}

/** A node's label: its name (ECharts would show its `id`), and its value with `showValues`. */
const nodeLabel = ({ data, value }: { data: unknown, value: unknown }): string => {
  const { name } = data as SankeyNode

  if (!showValues) {
    return name
  }

  return `${name}: ${valueFormatter ? valueFormatter(Number(value)) : String(value)}`
}

const generatedOption = computed((): EChartsOption => ({
  series: [
    deepMerge<SankeySeriesOption>({
      name: seriesName,
      type: 'sankey',
      data: coloredNodes.value,
      links: links ?? [],
      // Leave room on the right for the last column's labels
      left: 10,
      top: 10,
      right: 180,
      bottom: 10,
      nodeWidth: 12,
      nodeGap: 10,
      draggable: false,
      // Hovering a node or link highlights its connected flows and fades the rest
      emphasis: { focus: 'adjacency' },
      itemStyle: { borderWidth: 0 },
      lineStyle: {
        color: linkColor,
        opacity: 0.3,
        curveness: 0.5,
      },
      label: {
        color: colors.value.KUI_COLOR_TEXT,
        // Truncate long names (e.g. emails) so they don't run off the chart
        width: 160,
        overflow: 'truncate',
        formatter: nodeLabel,
      },
    }, seriesOption),
  ],
}))

// `option` always deep-merges over the generated option. Arrays (including
// `series`) replace, so series tweaks go through `seriesOption` instead
const mergedOption = computed(() => deepMerge(generatedOption.value, option))
</script>

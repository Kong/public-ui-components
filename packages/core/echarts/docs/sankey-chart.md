# SankeyChart

`SankeyChart` shows how a value flows between groups: nodes in columns, joined by links whose width maps to the value flowing through them. It's a good fit for "who uses what" questions where both sides overlap, like models and the consumers using them: a consumer can use several models, and a model has many consumers.

```vue
<script setup lang="ts">
import { SankeyChart } from '@kong-ui-public/echarts'
import type { SankeyLink, SankeyNode } from '@kong-ui-public/echarts'

const nodes: SankeyNode[] = [
  { id: 'model:gpt-5', name: 'gpt-5' },
  { id: 'model:claude-sonnet-5-5', name: 'claude-sonnet-5-5' },
  { id: 'consumer:alex', name: 'alex@example.com' },
  { id: 'consumer:sam', name: 'sam@example.com' },
]

const links: SankeyLink[] = [
  { source: 'model:gpt-5', target: 'consumer:alex', value: 300 },
  { source: 'model:gpt-5', target: 'consumer:sam', value: 100 },
  { source: 'model:claude-sonnet-5-5', target: 'consumer:alex', value: 150 },
]
</script>

<template>
  <SankeyChart
    :links="links"
    :nodes="nodes"
    series-name="Requests"
  />
</template>
```

## Data

`nodes` and `links` are ECharts' own sankey data, with a few fields made required:

- A `SankeyNode` has an `id`, unique across the whole chart, and a `name` shown as its label. Names can repeat: an `Other` node in two columns needs two ids, like `model:other` and `consumer:other`, or ECharts merges them into one node.
- A `SankeyLink` goes from a `source` node id to a `target` node id, with a `value` setting its width. Links must not form a cycle.

Columns come from the links: nodes with no incoming links start on the left, and each link moves one column to the right. Set `depth` on a node to put it in a specific column.

A node's height is the larger of its incoming and outgoing values. Set `value` on a node to make it taller than its links, e.g. a model sized by its total requests while only its links to its top consumers are drawn:

```ts
const nodes: SankeyNode[] = [
  // 245,000 requests in total, of which the links below show 67,400
  { id: 'model:gpt-5', name: 'gpt-5', value: 245000 },
  { id: 'consumer:alex', name: 'alex@example.com' },
  { id: 'consumer:sam', name: 'sam@example.com' },
]

const links: SankeyLink[] = [
  { source: 'model:gpt-5', target: 'consumer:alex', value: 43100 },
  { source: 'model:gpt-5', target: 'consumer:sam', value: 24300 },
]
```

### Colors

Each node gets the next color from the palette (theme design tokens by default, or `colorPalette`), cycling when there are more nodes than colors. A node's own `itemStyle.color` wins over the palette:

```ts
const nodes: SankeyNode[] = [
  { id: 'status:2XX', name: '2XX', itemStyle: { color: '#00d6a4' } },
  { id: 'status:5XX', name: '5XX', itemStyle: { color: '#ff3954' } },
]
```

Links take their source node's color by default. Set `linkColor` to `target`, or to `gradient` for a fade from the source's color to the target's.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `nodes` | `SankeyNode[]` | `[]` | Nodes, linked by their `id`. |
| `links` | `SankeyLink[]` | `[]` | Flows between nodes, by node `id`. |
| `seriesName` | `string` | none | Series name, shown as the tooltip's metric. |
| `showValues` | `boolean` | none (name only) | Shows each node's value after its name, formatted with `valueFormatter`. |
| `valueFormatter` | `(value: number) => string` | none | Formats values in the tooltip and the node labels. |
| `colorPalette` | `string[]` | theme tokens | Categorical node colors, cycled if there are more nodes than colors. To color specific nodes, see [Colors](#colors). |
| `linkColor` | `'source' \| 'target' \| 'gradient'` | `'source'` | Link color: their source node's, their target node's, or a gradient between the two. |
| `tooltipTitle` | `string` | none | Bold title of the shared tooltip, see [Tooltip](#tooltip). |
| `seriesOption` | `SankeySeriesOption` | none | Deep-merged into the generated sankey series, e.g. `{ nodeWidth: 20 }`, see [custom options](./custom-options.md#tweaking-the-generated-series). |
| `option` | `EChartsOption` | none | Raw ECharts option, always deep-merged over the generated config, see [custom options](./custom-options.md). |
| `height` | `string` | `400px` | Chart height, applied via CSS `v-bind`. |

## Interaction

Hovering a node or link highlights the links connected to it and fades the rest. Nodes can't be dragged.

Clicking a node emits `node-click` with that node, as it was passed in `nodes`:

```vue
<SankeyChart
  :links="links"
  :nodes="nodes"
  @node-click="(node) => selectModel(node.id)"
/>
```

Long node names are truncated to fit the room on the right of the chart. Change the label width or that room with `seriesOption`, e.g. `{ right: 240, label: { width: 220 } }`.

## Tooltip

Hovering shows the tooltip shared by all charts in this package (the same look as the `@kong-ui-public/analytics-chart` tooltips), with `seriesName` as the metric and values formatted with `valueFormatter`:

- A link shows its source node as the subtitle, and a row with its target node and value, in the source node's color.
- A node shows a row with its name and value.

```vue
<SankeyChart
  :links="links"
  :nodes="nodes"
  series-name="Requests"
  tooltip-title="Model usage by consumer"
  :value-formatter="(value) => value.toLocaleString()"
/>
```

The default colors come from the active theme's design tokens; see [Theming](./theming.md) for how that works.

For customizing the generated option, see [Custom options](./custom-options.md).

# TreeMapChart

`TreeMapChart` renders hierarchical data as nested rectangles: each top-level group gets a color from a categorical palette (theme design tokens by default), and its children subdivide it, their hue inherited with varied saturation. Area maps to value, so it's a good fit for part-to-whole questions like "which services use the most resources?".

```vue
<script setup lang="ts">
import { TreeMapChart } from '@kong-ui-public/e-charts'
import type { TreeMapDataNode } from '@kong-ui-public/e-charts'

const data: TreeMapDataNode[] = [
  {
    name: 'Gateways',
    children: [
      { name: 'us-east', value: 300 },
      { name: 'eu-west', value: 200 },
    ],
  },
  {
    name: 'Plugins',
    children: [{ name: 'rate-limiting', value: 150 }],
  },
]
</script>

<template>
  <TreeMapChart
    :data="data"
    series-name="Resources"
  />
</template>
```

## Data

`data` is a tree of `TreeMapDataNode`s: a `name`, an optional `value` (required on leaves), and optional `children`. A parent's value defaults to the sum of its children. Top-level nodes become the colored groups; deeper nodes subdivide their parent's rectangle proportionally to value:

```ts
const data: TreeMapDataNode[] = [
  {
    name: 'Data plane nodes',
    children: [
      {
        name: 'aws',
        children: [
          { name: 'prod', value: 120 },
          { name: 'staging', value: 40 },
        ],
      },
      { name: 'gcp', value: 50 },
    ],
  },
]
```

Each node can also carry its own `itemStyle` (fill and borders) and `label` tweaks, which override the generated palette-derived styling for that node. This is how a dense dashboard card colors every box from its own scale instead of the categorical group palette:

```ts
const data: TreeMapDataNode[] = [
  {
    name: 'Data plane nodes',
    children: [
      { name: 'prod', value: 120, itemStyle: { color: '#e0a3a3' } },
      { name: 'staging', value: 40, itemStyle: { color: '#9db8d2' } },
    ],
  },
]
```

Group names are not drawn on the boxes by default (a reserved strip renders empty when a group is too short for the text); they appear in the tooltip instead. Add one with `seriesOption: { levels: [{ upperLabel: { show: true } }] }` on tall charts.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TreeMapDataNode[]` | `[]` | Hierarchical data: top-level groups with nested children. |
| `seriesName` | `string` | none | Series name, shown as the tooltip's metric. |
| `showValues` | `boolean` | none (name only) | Shows each node's value under its name, formatted with `valueFormatter`. |
| `valueFormatter` | `(value: number) => string` | none | Formats values in the tooltip and the node labels. |
| `colorPalette` | `string[]` | theme tokens | Categorical colors, one per top-level group; cycled if there are more groups than colors. |
| `drillDown` | `boolean` | `true` | Click a group to zoom into it, with a breadcrumb to go back. `false` makes a static chart that fills the whole area, see [drill-down](#drill-down--breadcrumb). |
| `leafDepth` | `number` | none (all levels) | Initial depth to show (counted from zero at the view root); deeper levels appear when drilling in. |
| `tooltipTitle` | `string` | none | Bold title of the shared tooltip, see [Tooltip](#tooltip). |
| `seriesOption` | `TreemapSeriesOption` | none | Deep-merged into the generated treemap series, e.g. `{ label: { fontWeight: 'bold' } }`, see [custom options](./custom-options.md#tweaking-the-generated-series). |
| `option` | `EChartsOption` | none | Raw ECharts option, always deep-merged over the generated config, see [custom options](./custom-options.md). |
| `height` | `string` | `400px` | Chart height, applied via CSS `v-bind`. |

## Tooltip

Hovering a node shows the tooltip shared by all charts in this package (the same look as the `@kong-ui-public/analytics-chart` tooltips): the node's parent groups (e.g. `Gateways / us-east`) and `seriesName` as the subtitle, and a row with the node's color, its name and its value formatted with `valueFormatter`.

Like `@kong-ui-public/analytics-chart`, the content comes from the chart's data: pass `seriesName` for the metric, `valueFormatter` for the value and `tooltipTitle` for a bold title (empty by default):

```vue
<TreeMapChart
  :data="data"
  series-name="Memory"
  tooltip-title="Consumption by service"
  :value-formatter="(value) => `${value.toFixed(1)} GB`"
/>
```

## Drill-down & breadcrumb

By default, clicking a group zooms into it, and a breadcrumb at the bottom of the chart (with room reserved for it) navigates back up. Set `leafDepth` to limit the initial view to that depth, so deeper levels only appear when drilling in. The mouse wheel doesn't zoom, so scrolling over the chart scrolls the page.

For a static card, set `drill-down` to `false`: clicks do nothing, there's no breadcrumb, and the treemap fills the whole chart area:

```vue
<TreeMapChart
  :data="data"
  :drill-down="false"
  series-name="Resources"
/>
```

The default colors come from the active theme's design tokens; see [Theming](./theming.md) for how that works and how to override it with `colorPalette`.

For customizing the generated option, see [Custom options](./custom-options.md).

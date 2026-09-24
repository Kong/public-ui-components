# HeatmapChart

`HeatmapChart` renders a category-by-category intensity grid (think GitHub's contribution graph): columns on the x-axis, rows on the y-axis, and a `[column, row, value]` data point per cell. A `visualMap` scale (bottom of the chart) maps values to a two-color gradient, and the gradient colors come from the active theme's design tokens unless you supply your own.

```vue
<script setup lang="ts">
import { HeatmapChart } from '@kong-ui-public/e-charts'
import type { HeatmapDataPoint } from '@kong-ui-public/e-charts'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const data: HeatmapDataPoint[] = weekdays.flatMap((_, d) =>
  months.map((__, m) => [m, d, Math.floor(Math.random() * 100)]),
)
</script>

<template>
  <HeatmapChart
    :data="data"
    :x-axis-labels="months"
    :y-axis-labels="weekdays"
    series-name="Token usage"
  />
</template>
```

## Data

Each `HeatmapDataPoint` is a `[column, row, value]` triple. `column` and `row` can each be either:

- the category's **index** into `xAxisLabels` / `yAxisLabels` (a `number`), or
- the category's **name** itself (a `string`), matching one of the entries in `xAxisLabels` / `yAxisLabels`

Both forms can be mixed within the same dataset. Using names instead of indexes is convenient when your data is already keyed by category name:

```ts
const data: HeatmapDataPoint[] = [
  ['Jan', 'Mon', 12],
  ['Feb', 'Tue', 47],
]
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `HeatmapDataPoint[]` | `[]` | `[column, row, value]` triples; `column`/`row` are index or category name. |
| `xAxisLabels` | `string[]` | `[]` | Category labels for the x-axis (columns). |
| `yAxisLabels` | `string[]` | `[]` | Category labels for the y-axis (rows). |
| `seriesName` | `string` | none | Series name, shown in the tooltip. |
| `min` | `number` | `0` | Lower bound of the visual map. |
| `max` | `number` | largest data value (at least `1`) | Upper bound of the visual map. |
| `colorRange` | `string[]` | theme tokens | Gradient colors from low to high (two or more). |
| `valueFormatter` | `(value: number) => string` | none | Formats values in the tooltip (ECharts' `tooltip.valueFormatter`) and the visual map labels. |
| `tooltipFormatter` | `HeatmapTooltipFormatter` | ECharts default | Custom tooltip formatter (ECharts' `tooltip.formatter`). |
| `showValues` | `boolean` | `false` | Shows each cell's value inside the cell, formatted with `valueFormatter`. The text color adapts to the cell color. |
| `visibleRows` | `number` | none (all rows) | Shows at most this many rows, with a scrollbar to scroll through the rest, see [Scrolling rows](#scrolling-rows). |
| `seriesOption` | `HeatmapSeriesOption` | none | Deep-merged into the generated heatmap series, e.g. `{ itemStyle: { borderRadius: 0 } }`, see [custom options](./custom-options.md#tweaking-the-generated-series). |
| `option` | `EChartsOption` | none | Raw ECharts option, always deep-merged over the generated config, see [custom options](./custom-options.md). |
| `height` | `string` | `400px` | Chart height, applied via CSS `v-bind`. |

## Rows

Rows are drawn top-down in `yAxisLabels` order, so sort `yAxisLabels` to control the order (e.g. highest error rate first). Row labels longer than 160px are truncated with an ellipsis; change it with `option: { yAxis: { axisLabel: { width: 240 } } }`.

## Scrolling rows

Set `visibleRows` to show a fixed number of rows with a scrollbar on the right, for example the top 10 models out of 30. Drag the scrollbar to scroll. The mouse wheel is left to the page. If all rows fit, no scrollbar is added.

```vue
<HeatmapChart
  :data="errorRates"
  show-values
  :value-formatter="(value) => `${value.toFixed(1)}%`"
  :visible-rows="10"
  :x-axis-labels="days"
  :y-axis-labels="modelsSortedByErrorRate"
/>
```

For customizing the generated option, see [Custom options](./custom-options.md).

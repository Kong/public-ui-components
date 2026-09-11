# HeatmapChart

`HeatmapChart` renders a category-by-category intensity grid — think GitHub's contribution graph: columns on the x-axis, rows on the y-axis, and a `[column, row, value]` data point per cell. A `visualMap` scale (bottom of the chart) maps values to a two-color gradient, and the gradient colors come from the active theme's design tokens unless you supply your own.

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

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `HeatmapDataPoint[]` | `[]` | `[column, row, value]` triples. |
| `xAxisLabels` | `string[]` | `[]` | Category labels for the x-axis (columns). |
| `yAxisLabels` | `string[]` | `[]` | Category labels for the y-axis (rows). |
| `seriesName` | `string` | — | Series name, shown in the tooltip. |
| `min` | `number` | `0` | Lower bound of the visual map. |
| `max` | `number` | largest data value (at least `1`) | Upper bound of the visual map. |
| `colorRange` | `[string, string]` | theme tokens | `[low, high]` gradient colors. |
| `tooltipFormatter` | `HeatmapTooltipFormatter` | default | Custom tooltip formatter. |
| `option` | `EChartsOption` | — | Raw ECharts option; deep-merged over the generated config when data props are present, passed through untouched otherwise — see [custom options](./custom-options.md). |
| `height` | `string` | `400px` | Chart height, applied via CSS `v-bind`. |

For customizing the generated option, see [Custom options](./custom-options.md).

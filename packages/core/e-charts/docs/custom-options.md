# Custom options

Every chart wrapper component in this package accepts an `option` prop to customize the generated ECharts configuration, and a `seriesOption` prop to customize its generated series.

## Overriding the generated config

`option` is always deep-merged **over** the component's generated option, whether or not you also pass data props. Override only what you need:

```vue
<HeatmapChart
  :data="data"
  :x-axis-labels="months"
  :y-axis-labels="weekdays"
  :option="{ grid: { top: 20 } }"
/>
```

Merge behavior (see `deepMerge` in `src/utils`):

- Nested plain objects are merged recursively, your values win.
- Arrays and non-object values (strings, numbers, booleans) are **replaced**, not merged. For example, `xAxis.data` or `visualMap.inRange.color` in your option replaces the generated value.
- `series` is an array too, so passing `series` in `option` replaces the generated series entirely, including its `data`. Use `seriesOption` to tweak the generated series instead.
- `null`/`undefined` overrides are ignored.

## Tweaking the generated series

`seriesOption` is deep-merged into the generated series with the same rules. The series `data` still comes from the chart's data props:

```vue
<HeatmapChart
  :data="data"
  :x-axis-labels="months"
  :y-axis-labels="weekdays"
  :series-option="{ itemStyle: { borderRadius: 0 } }"
/>
```

## The base `ECharts` component (escape hatch)

When a chart wrapper's generated option doesn't fit your use case at all, use the base `ECharts` component directly. It takes `option` (passed straight to the underlying chart, with only the shared theme applied), `height`, and an optional `tooltipContent` for the shared tooltip (see below). It registers only the canvas renderer, `GridComponent` and `TooltipComponent`, so you register the chart type (and any other components) yourself:

```vue
<template>
  <ECharts
    :option="option"
    height="300px"
  />
</template>

<script setup lang="ts">
import { ECharts } from '@kong-ui-public/e-charts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import type { EChartsOption } from 'echarts'

// The renderer, grid and tooltip are already registered by `ECharts`
use([BarChart])

const option: EChartsOption = {
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [10, 20, 30] }],
}
</script>
```

### Shared tooltip

Pass `tooltipContent` to show the same tooltip as the other charts. It maps the hovered item's ECharts tooltip params to a title, an optional subtitle (`context` on the left, `metric` on the right) and rows with a color marker, label and formatted value:

```ts
import type { ChartTooltipContent } from '@kong-ui-public/e-charts'

const tooltipContent: ChartTooltipContent = (params) => {
  const point = Array.isArray(params) ? params[0] : params

  return {
    title: String(point.name),
    metric: 'Requests',
    rows: [{ color: String(point.color), label: point.seriesName ?? '', value: String(point.value) }],
  }
}
```

A `tooltip.formatter` in `option` replaces the shared tooltip.

## Notes

- Chart wrapper components (e.g. `HeatmapChart`) register the ECharts modules they need (chart type, `VisualMapComponent`, etc.) themselves, and the base `ECharts` component registers the renderer, grid and tooltip, so hosts using them never import ECharts directly.
- Every `@kong/design-tokens` color token is resolved from CSS custom properties at runtime (see [theming](./theming.md)), because ECharts renders to a canvas that can't consume `var()`. Explicit colors in `option` (or chart-specific props like `colorRange`) override theme defaults.

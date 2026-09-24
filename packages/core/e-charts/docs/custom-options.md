# Custom options

Every chart wrapper component in this package accepts an `option` prop that lets you customize the generated ECharts configuration.

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

Merge behavior (see `mergeChartOption` in `src/utils`):

- Nested plain objects are merged recursively, your values win.
- The top-level `series` array is merged by index when both the generated option and your override provide one, so `{ series: [{ label: { show: true } }] }` overrides just that field and keeps the generated series' `data`. Extra entries in your `series` array beyond the generated one are appended as-is.
- Any other array or non-object value (strings, numbers, booleans) is **replaced**, not merged. For example, `xAxis.data` or `visualMap.inRange.color` in your option replaces the generated array.
- Because `series` entries merge by index, a key you don't set keeps its generated value. To change the data, set `data` on the entry explicitly.
- `null`/`undefined` overrides are ignored.

## The base `ECharts` component (escape hatch)

When a chart wrapper's generated option doesn't fit your use case at all, use the base `ECharts` component directly. It takes `option` (passed straight to the underlying chart, with only the shared theme applied) and `height`, and registers only the canvas renderer, `GridComponent` and `TooltipComponent`, so you register the chart type (and any other components) yourself:

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

## Notes

- Chart wrapper components (e.g. `HeatmapChart`) register the ECharts modules they need (chart type, `VisualMapComponent`, etc.) themselves, and the base `ECharts` component registers the renderer, grid and tooltip, so hosts using them never import ECharts directly.
- Every `@kong/design-tokens` color token is resolved from CSS custom properties at runtime (see [theming](./theming.md)), because ECharts renders to a canvas that can't consume `var()`. Explicit colors in `option` (or chart-specific props like `colorRange`) override theme defaults.

# Custom options

Every chart wrapper component in this package accepts an `option` prop that lets you customize or completely take over the generated ECharts configuration.

## Passing only `option`

When you pass `option` without any data props (e.g. `data` on `HeatmapChart`), it is forwarded to the underlying ECharts instance untouched. Use this when the generated config doesn't fit your use case and you want full control:

```vue
<template>
  <HeatmapChart :option="option" />
</template>

<script setup lang="ts">
import { HeatmapChart } from '@kong-ui-public/e-charts'
import type { EChartsOption } from 'echarts'

const option: EChartsOption = {
  // ...any valid ECharts option, fully replacing the generated config
}
</script>
```

## Overriding the generated config

When you pass `option` alongside data props, your option is deep-merged **over** the component's generated option. Override only what you need:

```vue
<HeatmapChart
  :data="data"
  :x-axis-labels="months"
  :y-axis-labels="weekdays"
  :option="{ grid: { top: 20 } }"
/>
```

Deep-merge behavior:

- Nested plain objects are merged recursively — your values win.
- Arrays and non-object values (strings, numbers, booleans) are **replaced**, not merged. To replace the `series` array wholesale, provide it fully formed.
- Null and undefined overrides are ignored.

## Notes

- Chart components register the ECharts modules (renderer, chart type, `GridComponent`, `TooltipComponent`, etc.) they need, so hosts never import ECharts directly.
- Colors are resolved from `@kong/design-tokens` CSS custom properties at runtime (see `useChartColors`), because ECharts renders to a canvas that can't consume `var()`. Explicit colors in `option` (or chart-specific props like `colorRange`) override theme defaults.

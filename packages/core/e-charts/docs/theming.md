# Theming

ECharts renders to a `<canvas>`, so chart colors and fonts can't consume `var(--kui-color-*)` / `var(--kui-font-family-text)` the way DOM components do. This package resolves the active theme's `@kong/design-tokens` values from the document at runtime instead, and keeps charts in sync when the theme changes.

## Where the colors come from

- `chartColors()` (and the reactive `useChartColors()`) resolve every `@kong/design-tokens` color token (`KUI_COLOR_*`) from the corresponding CSS custom property on `<html>` (e.g. `KUI_COLOR_TEXT` from `--kui-color-text`), falling back to the token's static value from `@kong/design-tokens` when the custom property isn't set (e.g. in tests, or SSR).
- The font family is resolved from `--kui-font-family-text`, falling back to the static `KUI_FONT_FAMILY_TEXT` token.
- The base `ECharts` component (which every chart wrapper renders through) builds a small ECharts theme object from these resolved values (see `useChartTheme`) and passes it to the underlying chart's `theme` prop, covering text color/font, category/value axis labels and lines, tooltip background/border/text, `visualMap` text, and legend text.
- Chart-specific colors (e.g. `HeatmapChart`'s `colorRange`) are resolved the same way, and can always be overridden via props or `option`.

## Reactivity

`useChartColors()` watches the `data-kui-theme` attribute on `<html>` with a `MutationObserver`, so switching themes (e.g. setting `data-kui-theme="electric-lime-night"`) re-resolves colors and re-renders the chart automatically, without a page reload.

You can also pass your own trigger ref if you want colors to re-resolve on some other signal, in addition to `data-kui-theme` changes:

```ts
import { ref } from 'vue'
import { useChartColors } from '@kong-ui-public/e-charts'

const refreshSignal = ref(0)
const colors = useChartColors(refreshSignal)

// later, e.g. after your own theme toggle:
refreshSignal.value++
```

## Using theme colors in a custom `option`

Use `chartColors()` (non-reactive) or `useChartColors()` (reactive `Ref`) directly when building a custom `option`, so your chart matches the rest of the UI:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ECharts, useChartColors } from '@kong-ui-public/e-charts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import type { EChartsOption } from 'echarts'

use([BarChart])

const colors = useChartColors()

const option = computed((): EChartsOption => ({
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    data: [10, 20, 30],
    itemStyle: { color: colors.value.KUI_COLOR_BACKGROUND_PRIMARY },
  }],
}))
</script>

<template>
  <ECharts :option="option" />
</template>
```

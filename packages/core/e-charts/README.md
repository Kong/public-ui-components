# @kong-ui-public/e-charts

ECharts-based chart components for Kong UI, with theme-reactive colors resolved from `@kong/design-tokens` at runtime.

## Features

- `HeatmapChart`: GitHub-contribution-style intensity grid with theme-token gradient colors
- `ECharts`: the raw base component, for building custom chart types
- A shared tooltip for every chart, matching the tooltips in `@kong-ui-public/analytics-chart`
- `useChartColors`: resolves every `@kong/design-tokens` color token from the active theme's CSS custom properties, since canvas charts can't consume `var()`

## Requirements

- `vue` must be initialized in the host application
- `echarts` (>= 6) and `vue-echarts` (>= 8) must be installed as `dependency`/`devDependency` in the host application. They are `peerDependencies` of this package and are **not** bundled into its dist

## Usage

### Install

Install the package along with its peer dependencies in your host application:

```sh
pnpm add @kong-ui-public/e-charts echarts vue-echarts
```

Import the styles in your application. They provide the chart's default height (`400px`, overridable via the `height` prop):

```typescript
import '@kong-ui-public/e-charts/dist/style.css'
```

### Sizing

Charts default to a `400px` height, set via the `height` prop (a CSS length, e.g. `height="300px"`). Passing `height="100%"` only works when the chart has a parent with a real, non-percentage height (e.g. a flex or grid item with `flex: 1` / `min-height: 0` and a bounded ancestor), since a `%` height needs something concrete to resolve against.

Charts autoresize to their container by default (`vue-echarts`'s `autoresize` option), so they redraw on container resize without any extra wiring.

### Events

Native `echarts` events (e.g. `click`, `mouseover`, `legendselectchanged`) are forwarded from the underlying chart. Listen the same way you would on any Vue component:

```vue
<HeatmapChart
  :data="data"
  @click="onClick"
/>
```

### Documentation

- [Theming](./docs/theming.md): how colors and fonts come from design tokens
- [Custom options](./docs/custom-options.md): how to pass custom ECharts options to any chart wrapper component, and the base `ECharts` escape hatch
- [HeatmapChart](./docs/heatmap-chart.md): what it does and how to use it
- [Adding a chart type](./docs/adding-a-chart-type.md): contributor checklist for adding a new chart wrapper

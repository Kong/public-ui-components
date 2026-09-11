# @kong-ui-public/e-charts

ECharts-based chart components for Kong UI, with theme-reactive colors resolved from `@kong/design-tokens` at runtime.

## Features

- `HeatmapChart` — GitHub-contribution-style intensity grid with theme-token gradient colors
- `useChartColors` — resolves chart colors from the active theme's CSS custom properties, since canvas charts can't consume `var()`

## Requirements

- `vue` must be initialized in the host application
- `echarts` (>= 6) and `vue-echarts` (>= 8) must be installed as `dependency`/`devDependency` in the host application — they are `peerDependencies` of this package and are **not** bundled into its dist

## Usage

### Install

Install the package along with its peer dependencies in your host application:

```sh
pnpm add @kong-ui-public/e-charts echarts vue-echarts
```

Import the styles in your application — they provide the chart's default height (`400px`, overridable via the `height` prop):

```typescript
import '@kong-ui-public/e-charts/dist/style.css'
```

### Documentation

- [Custom options](./docs/custom-options.md) — how to pass custom ECharts options to any chart wrapper component
- [HeatmapChart](./docs/heatmap-chart.md) — what it does and how to use it

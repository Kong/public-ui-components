# @kong-ui-public/e-charts

ECharts-based chart components for Kong UI, with theme-reactive colors resolved from `@kong/design-tokens` at runtime.

## Features

- `HeatmapChart` — GitHub-contribution-style intensity grid with theme-token gradient colors
- `useChartColors` — resolves chart colors from the active theme's CSS custom properties, since canvas charts can't consume `var()`

## Requirements

- `vue`
- `echarts` >= 6
- `vue-echarts` >= 8

## Usage

### Install

```sh
pnpm add @kong-ui-public/e-charts
```

### Documentation

- [Custom options](./docs/custom-options.md) — how to pass custom ECharts options to any chart wrapper component
- [HeatmapChart](./docs/heatmap-chart.md) — what it does and how to use it

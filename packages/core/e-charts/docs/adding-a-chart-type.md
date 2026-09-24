# Adding a chart type

Checklist for adding a new chart wrapper component (using `HeatmapChart` as the reference implementation):

1. **Create the component** at `src/components/chart-types/XChart.vue`.
2. **Register the echarts modules it needs** with `use()` from `echarts/core`: the chart type itself, plus any extra components (e.g. `VisualMapComponent`). The canvas renderer, `GridComponent` and `TooltipComponent` are already registered by the base `ECharts` component, so don't register them again.
3. **Extend `BaseChartProps`** in `src/types/index.ts` with the props specific to your chart (data shape, labels, formatters, etc.), and export any new data types (e.g. `XDataPoint`).
4. **Build the generated option** in a `computed` inside the component. Pull theme colors from `useChartColors()` for any color defaults (gradients, borders, etc.), the same way `HeatmapChart` uses `colors.value.KUI_COLOR_*`.
5. **Merge with `deepMerge`** (from `src/utils`): merge the `seriesOption` prop into your generated series (typed with the matching ECharts series type, e.g. `HeatmapSeriesOption`), then merge the `option` prop over the whole generated option. Don't add a "pass option through untouched" branch: `option` always merges.
6. **Render through the base `ECharts` component**, passing your merged option and `height`, so the shared theme (colors, fonts) is applied consistently.
7. **Export the component** from `src/index.ts`.
8. **Add tests**:
   - A Vitest spec (`XChart.spec.ts`) asserting the generated option, prop-driven overrides, and the `option` merge behavior, following `HeatmapChart.spec.ts`.
   - A Cypress component spec (`XChart.cy.ts`) that mounts the chart in a real browser and asserts it actually paints (e.g. checking canvas pixel data), following `HeatmapChart.cy.ts`.
9. **Add a sandbox page** under `sandbox/pages/`, and register it in `sandbox/index.ts` (route) and `sandbox/navigation.ts` (nav link).
10. **Add a doc** at `docs/x-chart.md` (props table, data shape, example), and link it from `README.md`.

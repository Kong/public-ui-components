# @kong-ui-public/analytics-echarts

Vue 3 analytics chart components backed by [Apache ECharts](https://echarts.apache.org/). The package renders Konnect analytics `ExploreResultV4` data as timeseries charts, cross-sectional bar charts, and donut charts with shared Kong chart styling, legends, tooltips, empty states, and truncation warnings.

- [Features](#features)
- [Requirements](#requirements)
- [Install](#install)
- [Package Exports](#package-exports)
- [TimeseriesChart](#timeserieschart)
  - [Props](#timeserieschart-props)
  - [Events](#timeserieschart-events)
  - [Example](#timeserieschart-example)
- [CrossSectionChart](#crosssectionchart)
  - [Props](#crosssectionchart-props)
  - [Example](#crosssectionchart-example)
- [Data Shape](#data-shape)
- [Local Development](#local-development)

## Features

- Timeseries line and bar charts.
- Vertical bar, horizontal bar, and donut charts for cross-sectional analytics.
- SVG and Canvas ECharts render modes.
- Light and dark ECharts themes.
- Legend filtering and optional formatted legend values.
- Timeseries brush selection for zoom, explore, and request actions.
- Timeseries threshold lines and optional threshold intersection highlighting.
- Cross-sectional annotations and automatic data zoom for dense bar charts.
- Empty-state and truncated-result messaging.

## Requirements

- `vue` must be initialized in the host application.
- `@kong-ui-public/i18n` must be available in the host application.
- `@kong/kongponents` must be available in the host application.
- Input data should follow `ExploreResultV4` from `@kong-ui-public/analytics-utilities`.

## Install

```sh
pnpm add @kong-ui-public/analytics-echarts
```

For workspace consumers in this monorepo, use the workspace dependency:

```json
{
  "dependencies": {
    "@kong-ui-public/analytics-echarts": "workspace:^"
  }
}
```

## Package Exports

```ts
import {
  CrossSectionChart,
  TimeseriesChart,
  type AnalyticsChartColors,
  type ChartLegendItem,
  type ChartLegendSortFn,
  type ChartTooltipSortFn,
  type ChartType,
  type ExternalLink,
  type LegendPosition,
  type Threshold,
  type ThresholdType,
  type TooltipEntry,
} from '@kong-ui-public/analytics-echarts'
```

| Export | Description |
| --- | --- |
| `TimeseriesChart` | Vue component for `timeseries_line` and `timeseries_bar` charts. |
| `CrossSectionChart` | Vue component for `horizontal_bar`, `vertical_bar`, and `donut` charts. |
| `AnalyticsChartColors` | Color palette type. Accepts either an array of colors or a map from dataset label to color. |
| `ChartLegendItem` | Legend item shape passed to custom legend sort functions. |
| `ChartLegendSortFn` | Sort function type for legend items. |
| `ChartTooltipSortFn` | Sort function type for tooltip entries. |
| `ChartType` | Union of supported chart type strings. |
| `ExternalLink` | Link object used by tooltip actions. |
| `LegendPosition` | Supported legend positions: `bottom` or `hidden`. |
| `Threshold` | Timeseries threshold configuration. |
| `ThresholdType` | Threshold severity: `warning`, `error`, or `neutral`. |
| `TooltipEntry` | Tooltip entry shape passed to custom tooltip sort functions. |

## TimeseriesChart

Use `TimeseriesChart` for time-based analytics. The component accepts `ExploreResultV4` data where each record has a `timestamp` and one or more numeric metric fields.

### TimeseriesChart Props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `data` | `ExploreResultV4` | Yes | - | Analytics result data. |
| `type` | `'timeseries_line' \| 'timeseries_bar'` | Yes | - | ECharts series style. |
| `stacked` | `boolean` | No | `false` | Stack series with the same axis. For line charts this also controls area fill through the chart data builder. |
| `timeseriesZoom` | `boolean` | No | `false` | Enables the zoom action after a chart range is brushed. |
| `requestsLink` | `ExternalLink` | No | - | Adds a tooltip action that links to request details for the brushed time range. Also enables brushing. |
| `exploreLink` | `ExternalLink` | No | - | Adds a tooltip action that links to explore for the brushed time range. Also enables brushing. |
| `threshold` | `Partial<Record<string, Threshold[]>>` | No | - | Draws threshold lines. Thresholds with `highlightIntersections: true` also shade intersections. |
| `colorPalette` | `string[] \| AnalyticsChartColors` | No | internal palette | Custom series colors. Arrays are cycled; object keys map labels to colors. |
| `tooltipTitle` | `string` | No | derived from metric | Title shown in chart tooltips. |
| `emptyStateTitle` | `string` | No | localized default | Empty-state title when no valid chart data exists. |
| `emptyStateDescription` | `string` | No | localized default | Empty-state body when no valid chart data exists. |
| `metricAxesTitle` | `string` | No | derived from metric/unit | Metric axis title. |
| `dimensionAxesTitle` | `string` | No | derived from granularity | Time axis title. |
| `showLegendValues` | `boolean` | No | `false` | Shows formatted totals next to legend labels. |
| `legendPosition` | `LegendPosition` | No | `'bottom'` | Displays the legend at the bottom or hides it. |
| `chartLegendSortFn` | `ChartLegendSortFn` | No | default value sort | Custom legend item ordering. |
| `chartTooltipSortFn` | `ChartTooltipSortFn` | No | default value sort | Custom tooltip entry ordering. |
| `hideTruncationWarning` | `boolean` | No | `false` | Suppresses the warning shown when the query result is truncated. |
| `theme` | `'light' \| 'dark'` | No | `'light'` | ECharts theme. |
| `renderMode` | `'svg' \| 'canvas'` | No | `'svg'` | ECharts renderer. |

### TimeseriesChart Events

| Event | Payload | Description |
| --- | --- | --- |
| `zoom-time-range` | `AbsoluteTimeRangeV4` | Emitted when the user selects a range and clicks the zoom action. |
| `select-chart-range` | `AbsoluteTimeRangeV4` | Emitted when the user finishes brushing a valid chart range. |

### TimeseriesChart Example

```vue
<template>
  <TimeseriesChart
    :data="chartData"
    type="timeseries_line"
    :threshold="threshold"
    :timeseries-zoom="true"
    tooltip-title="Requests"
    @zoom-time-range="handleZoom"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AbsoluteTimeRangeV4, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { TimeseriesChart, type Threshold } from '@kong-ui-public/analytics-echarts'

const chartData = ref<ExploreResultV4>({
  data: [
    {
      timestamp: '2026-04-24T10:00:00.000Z',
      event: {
        service: 'billing-api',
        request_count: 120,
      },
    },
    {
      timestamp: '2026-04-24T11:00:00.000Z',
      event: {
        service: 'billing-api',
        request_count: 180,
      },
    },
  ],
  meta: {
    start: '2026-04-24T10:00:00.000Z',
    end: '2026-04-24T11:00:00.000Z',
    display: {
      service: {
        'billing-api': { name: 'Billing API' },
      },
    },
    granularity_ms: 3600000,
    metric_names: ['request_count'],
    metric_units: {
      request_count: 'count',
    },
    query_id: 'example-query',
  },
})

const threshold = ref<Partial<Record<string, Threshold[]>>>({
  request_count: [
    {
      type: 'warning',
      value: 150,
      highlightIntersections: true,
    },
  ],
})

const handleZoom = (timeRange: AbsoluteTimeRangeV4) => {
  console.log(timeRange)
}
</script>
```

## CrossSectionChart

Use `CrossSectionChart` for categorical analytics. The component accepts `ExploreResultV4` data where each record has one or more dimension fields and one or more numeric metric fields.

### CrossSectionChart Props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `data` | `ExploreResultV4` | Yes | - | Analytics result data. |
| `type` | `'horizontal_bar' \| 'vertical_bar' \| 'donut'` | Yes | - | Chart visualization type. |
| `stacked` | `boolean` | No | `false` | Stacks bar series when multiple datasets are present. |
| `colorPalette` | `string[] \| AnalyticsChartColors` | No | internal palette | Custom series colors. Arrays are cycled; object keys map labels to colors. |
| `tooltipTitle` | `string` | No | derived from metric | Title shown in chart tooltips. |
| `emptyStateTitle` | `string` | No | localized default | Empty-state title when no valid chart data exists. |
| `emptyStateDescription` | `string` | No | localized default | Empty-state body when no valid chart data exists. |
| `metricAxesTitle` | `string` | No | derived from metric/unit | Metric axis title for bar charts. |
| `dimensionAxesTitle` | `string` | No | derived from dimension | Dimension axis title for bar charts. |
| `showAnnotations` | `boolean` | No | `true` | Shows bar value annotations when the responsive chart layout allows them. |
| `showLegendValues` | `boolean` | No | `false` | Shows formatted totals next to legend labels. |
| `legendPosition` | `LegendPosition` | No | `'bottom'` | Displays the legend at the bottom or hides it. |
| `chartLegendSortFn` | `ChartLegendSortFn` | No | default value sort | Custom legend item ordering. |
| `chartTooltipSortFn` | `ChartTooltipSortFn` | No | default value sort | Custom tooltip entry ordering. |
| `hideTruncationWarning` | `boolean` | No | `false` | Suppresses the warning shown when the query result is truncated. |
| `theme` | `'light' \| 'dark'` | No | `'light'` | ECharts theme. |
| `renderMode` | `'svg' \| 'canvas'` | No | `'svg'` | ECharts renderer. |

### CrossSectionChart Example

```vue
<template>
  <CrossSectionChart
    :data="chartData"
    type="vertical_bar"
    :show-legend-values="true"
    tooltip-title="Requests by service"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { CrossSectionChart } from '@kong-ui-public/analytics-echarts'

const chartData = ref<ExploreResultV4>({
  data: [
    {
      timestamp: '2026-04-24T10:00:00.000Z',
      event: {
        service: 'billing-api',
        request_count: 120,
      },
    },
    {
      timestamp: '2026-04-24T10:00:00.000Z',
      event: {
        service: 'identity-api',
        request_count: 95,
      },
    },
  ],
  meta: {
    start: '2026-04-24T10:00:00.000Z',
    end: '2026-04-24T11:00:00.000Z',
    display: {
      service: {
        'billing-api': { name: 'Billing API' },
        'identity-api': { name: 'Identity API' },
      },
    },
    granularity_ms: 3600000,
    metric_names: ['request_count'],
    metric_units: {
      request_count: 'count',
    },
    query_id: 'example-query',
  },
})
</script>
```

## Data Shape

Both components consume `ExploreResultV4`:

```ts
interface ExploreResultV4 {
  data: Array<{
    timestamp: string
    event: Record<string, string | number | null>
  }>
  meta: {
    start: string
    end: string
    display: Record<string, Record<string, { name: string }>>
    granularity_ms: number
    metric_names?: string[]
    metric_units?: Record<string, string>
    truncated?: boolean
    limit?: number
    query_id: string
  }
}
```

The chart data builders use `meta.metric_names` to identify metric fields and `meta.display` to map raw dimension values to labels. If `meta.truncated` is true and `meta.limit` is set, the shell shows a truncated-result warning unless `hideTruncationWarning` is enabled.

## Local Development

Run the package sandbox from the repository root:

```sh
pnpm --filter @kong-ui-public/analytics-echarts dev
```

Useful package checks:

```sh
pnpm --filter @kong-ui-public/analytics-echarts typecheck
pnpm --filter @kong-ui-public/analytics-echarts lint
pnpm --filter @kong-ui-public/analytics-echarts stylelint
pnpm --filter @kong-ui-public/analytics-echarts test:unit
```

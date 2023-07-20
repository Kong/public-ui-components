# @kong-ui-public/analytics-chart

Dynamic chart component for kong analytics.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Usage Example](#usage-example)

## Features

- Display kong analytics in a graph.

## Requirements

- `vue` must be initialized in the host application
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/analytics-chart
```

### Props - AnalyticsChart

#### `chartData`

- type: [AnalyticsExploreResult](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L77)
- required: `true`

#### `chartOptions`

- type: [AnalyticsChartOptions](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-chart/src/types/chart-data.ts)
- required: `true`
- `stacked` option only apply to time series charts
- `fill` only applies to time series line chart
- `chartTypes` defined [here](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/chart-types.ts)
- `chartDatasetColors` are optional
  - If no colors are provided, the default color palette will be used
  - If custom colors are needed you may provide a custom color palette in the form of:
    - Array of hex color codes which will be cycled through for each dataset:
      ```ts
      const colors = [
        '#a86cd5',
        '#6a86d2',
        '#00bbf9',
        '#00c4b0',
        '#ffdf15',
      ]
      ```
    - A mapping of dataset labels to hex color code:
      ```ts
        const statusCodeColors = {
          '200': '#a86cd5',
          '300': '#6a86d2',
          '400': '#00bbf9',
        }
      ```

#### `chartTitle`

- type: `string`
- required: `true`

#### `emptyStateTitle`

- type: `string`
- required: `false`

#### `emptyStateDescription`

- type: `string`
- required: `false`

#### `tooltipTitle`

- type: `string`
- required: `true`

#### `legendPosition`

- type: '[ChartLegendPosition](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-chart/src/types/chart-legend-position.ts)'
- required: `false`
- default: `right`

#### `height`

- type: `string`
- required: `false`
- default: `'400px'`
- set the chart height using css height values (px, %, etc...)

#### `width`

- type: `string`
- required: `false`
- default: `'100%'`
- set the chart width using css width values (px, %, etc...)

#### `showLegendValues`

- type: `boolean`
- required: `false`
- default: `true`
- Show the sum of each dataset in the legend

### Usage Example

```html
<template>
  <AnalyticsChart
    :chart-data="chartData"
    :chart-options="chartOptions"
    tooltip-title="Total Requests"
    chart-title="Requests by Service"
    :legend-position="legendPosition"
  />
</template>

<script>
import { AnalyticsChart } from '@kong-ui-public/analytics-chart'
import type { AnalyticsExploreResult } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'

import { defineComponent, ref } from 'vue'

export default defineComponent({
  components: {
    AnalyticsChart,
  },
  setup() {
    const chartData = ref<AnalyticsExploreResult>({
      records: [
        {
          version: '1.0',
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'Service A',
            TotalRequests: 849,
          },
        },
        {
          version: '1.0',
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'Service B',
            TotalRequests: 5434,
          },
        },
        // more data...
      ],
      meta: {
        start: 1682332042798,
        end: 1682353642798,
        queryId: '12345',
        dimensions: {
          Service: ['Service A', 'Service B'],
        },
        metricNames: ['TotalRequests'],
        metricUnits: {
          TotalRequests: 'requests',
        },
        granularity: 3600000,
        truncated: false,
        limit: 1000,
      },
    })

    const chartOptions = ref<AnalyticsChartOptions>({
      type: 'TimeSeriesLine',
      stacked: true,
      fill: false
    })

    const legendPosition = ref(ChartLegendPosition.Right)


    return {
      chartData,
      chartOptions,
      legendPosition
    }
  },
})
</script>
```

### Props - SimpleChart

#### `chartData`

- type: [AnalyticsExploreResult](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L77)
- required: `true`

#### `chartOptions`
- type: [SimpleChartOptions](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-chart/src/types/chart-data.ts)
- required: `true`

#### `emptyStateTitle`

- type: `string`
- required: `false`

#### `metricDisplay`

Optional value which can be any one of the following:

- `Hidden`: will only show the outer doughnut chart
- `SingleMetric`: displays only the large metric value
- `Full`: displays both the large metric and subtext

#### SimpleChart

Contains the same chart-data 

```html
<template>
  <SimpleChart
    :chart-data="exploreResult"
    :chart-options="simpleChartOptions"
  />
</template>

<script>
import { SimpleChart } from '@kong-ui-public/analytics-chart'
import type { AnalyticsExploreResult } from '@kong-ui-public/analytics-utilities'
import type { SimpleChartOptions } from '@kong-ui-public/analytics-chart'

import { defineComponent, ref } from 'vue'

export default defineComponent({
  components: {
    SimpleChart,
  },
  setup() {
    const chartData = ref<AnalyticsExploreResult>({
      records: [
        {
          version: '1.0',
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'Service A',
            TotalRequests: 849,
          },
        },
        {
          version: '1.0',
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'Service B',
            TotalRequests: 5434,
          },
        },
      ],
      meta: {
        start: 1682332042798,
        end: 1682353642798,
        queryId: '12345',
        dimensions: {
          Service: ['Service A', 'Service B'],
        },
        metricNames: ['TotalRequests'],
        metricUnits: {
          TotalRequests: 'requests',
        },
      },
    })

    const chartOptions = ref<SimpleChartOptions>({
      type: ChartTypes.GAUGE,
      metricDisplay: ChartMetricDisplay.Full
    })

    return {
      chartData,
      chartOptions,
    }
  },
})
</script>
```

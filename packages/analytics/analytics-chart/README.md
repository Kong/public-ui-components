# @kong-ui-public/analytics-chart

Dynamic chart component for kong analytics.

- [Features](#features)
- [Requirements](#requirements)
- [Install](#install)
- [AnalyticsChart](#AnalyticsChart)
  - [Usage Example](#usage-example-analyticschart)
- [SimpleChart](#SimpleChart)
  - [Usage Example](#usage-example-simplechart)
- [CsvExportButton](#CsvExportButton)
  - [Usage Example](#usage-example-csvexportbutton)
- [CsvExportModal](#CsvExportModal)
  - [Events](#CsvExportModal-events)
  - [Usage Example](#usage-example-csvexportmodal)

## Features

- Display kong analytics in a graph.

## Requirements

- `vue` must be initialized in the host application
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.


## Install

Install the component in your host application

```sh
yarn add @kong-ui-public/analytics-chart
```

## AnalyticsChart

### `Props`

#### `allowCsvExport`

- type: boolean
- required: `false`

#### `chartData`

- type: [AnalyticsExploreResult](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/analytics-data.ts#L77)
- required: `true`

#### `chartOptions`

- type: [AnalyticsChartOptions](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-chart/src/types/chart-data.ts)
- required: `true`
- `stacked` option applies to timeseries charts as well as vertical/horizontal bar charts.
- `fill` only applies to time series line chart
- `chartTypes` defined [here](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/chart-types.ts)
- `threshold` is optional
  - A key / value pair of type `Record<ExploreAggregations: number>` will draw a dotted threshold line on a timeseries chart at the provided Y-axis value.
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
- `chartLegendSortFn`
  - Exposed sorting fn for datasets as they appear in the legend
  - Sorts in descending order of raw value by default.
- `chartTooltipSortFn`
  - Exposed sorting fn for datasets as they appear in the tooltip
  - Sorts in descending order of raw value by default.

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

#### `showLegendValues`

- type: `boolean`
- required: `false`
- default: `true`
- Show the sum of each dataset in the legend

#### `timeseriesZoom`

- type: `boolean`
- required: `false`
- default: `false`
- Enable zooming on timeseries charts

### Events
`@zoom-time-range` - event emitted representing a new time range on zoom selection see [AbsoluteTimeRangeV4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/common.ts#L33)

## Usage Example AnalyticsChart

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
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsChartOptions } from '@kong-ui-public/analytics-chart'

import { defineComponent, ref } from 'vue'

export default defineComponent({
  components: {
    AnalyticsChart,
  },
  setup() {
    const chartData = ref<ExploreResultV4>({
      data: [
        {
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'service-a-id',
            TotalRequests: 849,
          },
        },
        {
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'service-b-id',
            TotalRequests: 5434,
          },
        },
        // more data...
      ],
      meta: {
        start_ms: 1682332042798,
        end_ms: 1682353642798,
        granularity_ms: 3600000,
        query_id: '12345',
        display: {
          Service: {
            'service-a-id': { name: 'Service A' },
            'service-b-id': { name: 'Service B' },
        },
        metric_names: ['TotalRequests'],
        metric_units: {
          TotalRequests: 'requests',
        },
        truncated: false,
        limit: 1000,
      },
    })

    const chartOptions = ref<AnalyticsChartOptions>({
      type: 'timeseries_line',
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

## SimpleChart

### Props

#### `chartData`

- type: [ExploreResultV4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore-v4.ts)
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

#### `reverseDataset`

Optional. Determines the order of the datasets. In the case of a Gauge Chart, it reverses the display order of the two color fills.

- type: `boolean`
- required: `false`

#### `numerator`

Optional. Array index which specifies the dataset value to be shown in the center of the Gauge.

- type: `number`
- required: `false`

#### Usage Example SimpleChart

```html
<template>
  <SimpleChart
    :chart-data="chartData"
    :chart-options="simpleChartOptions"
  />
</template>

<script>
import { SimpleChart } from '@kong-ui-public/analytics-chart'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { SimpleChartOptions } from '@kong-ui-public/analytics-chart'

import { defineComponent, ref } from 'vue'

export default defineComponent({
  components: {
    SimpleChart,
  },
  setup() {
    const chartData = ref<ExploreResultV4>({
      data: [
        {
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'service-a-id',
            TotalRequests: 849,
          },
        },
        {
          timestamp: '2023-04-24T10:27:22.798Z',
          event: {
            Service: 'service-b-id',
            TotalRequests: 5434,
          },
        },
      ],
      meta: {
        start_ms: 1682332042798,
        end_ms: 1682353642798,
        granularity_ms: 21600000,
        query_id: '12345',
        display: {
          Service: {
            'service-a-id': { name: 'Service A' },
            'service-b-id': { name: 'Service B' },
        },
        metric_names: ['TotalRequests'],
        metric_units: {
          TotalRequests: 'requests',
        },
      },
    })

    const chartOptions = ref<SimpleChartOptions>({
      type: 'gauge',
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

## CsvExportButton

### Props

#### `data`

Chart data to be exported

- type: [ExploreResultV4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore-v4.ts)
- required: `true`

#### `text`

Text to appear in the button

- type: `string`
- required: `false`
- default: `'Export'`

#### `buttonAppearance`

Text to appear in the button

- type: `'primary' | 'secondary' | 'tertiary' | 'danger'`
- required: `false`
- default: `'tertiary'`

#### `filenamePrefix`

Resulting csv filename

- type: `string`
- required: `false`
- default: `'Chart Export'`

### Usage Example CsvExportButton

```html

<template>
  <CsvExportButton
    :data="(chartData as ExploreResultV4)"
    :filename-prefix="filenamePrefix"
  />
</template>

<script setup lang="ts">

import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { CsvExportButton } from '@kong-ui-public/analytics-chart'

const chartData = ref<ExploreResultV4>({
  data: [
    {
      timestamp: '2023-04-24T10:27:22.798Z',
      event: {
        Service: 'service-a-id',
        TotalRequests: 849,
      },
    },
    {
      timestamp: '2023-04-24T10:27:22.798Z',
      event: {
        Service: 'service-b-id',
        TotalRequests: 5434,
      },
    },
  ],
  meta: {
    start_ms: 1682332042798,
    end_ms: 1682353642798,
    granularity_ms: 3600000,
    query_id: '12345',
    display: {
      Service: {
        'service-a-id': { name: 'Service A' },
        'service-b-id': { name: 'Service B' },
    },
    metric_names: ['TotalRequests'],
    metric_units: {
      TotalRequests: 'requests',
    },
  },
})

const fileName = ref('exportFilename')

</script>

```

## CsvExportModal

### Props

#### `chartData`

Chart data to be exported

- type: [ExploreResultV4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore-v4.ts)
- required: `true`

#### `filename`

Resulting csv filename

- type: `string`
- required: `true`

#### `modalDescription`

Desctiption text that appears in the modal

- type: `string`
- required: `false`
- default: `'Exports a CSV of the data represented in the chart.'`

### CsvExportModal Events

`@toggle-modal` event is emitted when the modal is toggled (dismissed)

### Usage Example CsvExportModal

```html

<template>
  <button @click.prevent="exportCsv">
    Export to CSV
  </button>

  <CsvExportModal
    v-if="exportModalVisible"
    :chart-data="chartData"
    filename="exportCsvFilename"
    @toggle-modal="setModalVisibility"
  />
</template>

<script setup lang="ts">

import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { CsvExportModal } from '@kong-ui-public/analytics-chart'

const exportModalVisible = ref(false)

const setModalVisibility = (val: boolean) => {
  exportModalVisible.value = val
}
const exportCsv = () => {
  setModalVisibility(true)
}

const chartData = ref<ExploreResultV4>({
  data: [
    {
      timestamp: '2023-04-24T10:27:22.798Z',
      event: {
        Service: 'service-a-id',
        TotalRequests: 849,
      },
    },
    {
      timestamp: '2023-04-24T10:27:22.798Z',
      event: {
        Service: 'service-b-id',
        TotalRequests: 5434,
      },
    },
  ],
  meta: {
    start_ms: 1682332042798,
    end_ms: 1682353642798,
    granularity_ms: 3600000,
    query_id: '12345',
    display: {
      Service: {
        'service-a-id': { name: 'Service A' },
        'service-b-id': { name: 'Service B' }
      },
    },
    metric_names: ['TotalRequests'],
    metric_units: {
      TotalRequests: 'requests',
    },
  },
})

const fileName = ref('exportFilename')

</script>

```

## Development

Follow the setup instructions for the [top level README](../../../README.md). Then run the sandbox with:

```
pnpm run dev
```

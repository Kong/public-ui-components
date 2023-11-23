# @kong-ui-public/dashboard-renderer

Render Analytics charts on a page from a JSON definition.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)

## Requirements

- `vue` must be initialized in the host application
- A plugin providing a `QueryBridge` must be installed in the root of the application.
  - This plugin must `provide` a `query` method that adheres to the `QueryBridge` interface exported from this package.
  - The plugin's query method is in charge of passing the query to the correct API for the host app's environment.
  - See the sandbox plugin (`./sandbox/sandbox-query-provider.ts`) for an example that simply returns static data rather than consuming an API.
- `@kong-ui-public/analytics-chart` and `@kong/kongponents` must be installed as peer dependencies.

## Usage

### Props

This component only takes two properties:

- `context`: The time range that the dashboard should query and any additional filters that should be applied.
- `definition`: The dashboard definition.

### Example

```vue
<DashboardRenderer
  :context="context"
  :definition="definition"
/>
```

with the following data:

```typescript
const context: DashboardRendererContext = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '15M',
  },
}

const definition: DashboardDefinition = {
  // 5 x 5 grid
  gridSize: {
    cols: 5,
    rows: 5,
  }
  tiles: [
    {
      chart: {
        type: ChartTypes.HorizontalBar,
      },
      query: {},
      // Position at column 1, row 1
      position: {
        col: 1,
        row: 1,
      },
      // Spans 3 columns and 2 rows
      size: {
        col: 3,
        row: 2,
      }
    },
    {
      chart: {
        type: ChartTypes.Gauge,
        metricDisplay: ChartMetricDisplay.Full,
        reverseDataset: true,
        numerator: 0,
      },
      query: {},
      // Position at column 1, row 3
      position: {
        col: 1,
        row: 3,
      },
      // Spans 3 columns and 2 rows
      size: {
        col: 3,
        row: 2,
      }
    },
  ],
}
```

will render 2 charts, a horizontal bar chart and a gauge chart.

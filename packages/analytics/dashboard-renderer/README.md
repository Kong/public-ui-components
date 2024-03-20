# @kong-ui-public/dashboard-renderer

Render Analytics charts on a page from a JSON definition.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Props](#props)
  - [Example](#example)

## Requirements

- `vue` must be initialized in the host application
- A plugin providing an `AnalyticsBridge` must be installed in the root of the application.
  - This plugin must `provide` the necessary methods to adhere to the [AnalyticsBridge](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/query-bridge.ts) interface defined in `@kong-ui-public/analytics-utilities`.
  - The plugin's query method is in charge of passing the query to the correct API for the host app's environment.
  - See the sandbox plugin [sandbox-query-provider.ts](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/sandbox/sandbox-query-provider.ts) for an example that simply returns static data rather than consuming an API.
- The host application must supply peer dependencies for:
  - `@kong-ui-public/analytics-chart`
  - `@kong-ui-public/analytics-utilities`
  - `@kong-ui-public/analytics-metric-provider`
  - `@kong-ui-public/i18n`
  - `@kong/kongponents`
  - `swrv`
  - `vue`

## Usage

### Props

This component only takes two properties:

- [context](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/src/types/dashboard-renderer-types.ts) : The time range that the dashboard should query and any additional filters that should be applied.
- [config](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/src/types/dashboard-renderer-types.ts) : The dashboard config and layout.

For context `filters` and `timeSpec` see [here](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore-v4.ts)

### Example

```html
<DashboardRenderer
  :context="context"
  :config="config"
/>
```

with the following data:

```typescript

import type { DashboardRendererContext, DashboardConfig } from '@kong-ui-public/dashboard-renderer'
import { DashboardRenderer, ChartTypes } from '@kong-ui-public/dashboard-renderer'

const context: DashboardRendererContext = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '15M',
  },
}

const config: DashboardConfig = {
  // 4 x 1 grid
  gridSize: {
    cols: 4,
    rows: 1,
  }
  tiles: [
    {
      definition: {
        chart: {
          type: ChartTypes.HorizontalBar,
        },
        // Request count by route
        query: {
          metrics: ['request_count'],
          dimensions: ['route']
        },
      },
      layout: {
        // Position at column 0, row 0
        position: {
          col: 0,
          row: 0,
        },
        // Spans 2 columns and 1 rows
        size: {
          col: 2,
          row: 1,
        }
      }
    },
    {
      definition: {
        chart: {
          type: ChartTypes.TopN,
          chartTitle: 'Top N Table',
          description: 'Table description',
        },
        // Top 5 routes by request_count
        query: {
          metrics: ['request_count'],
          dimensions: ['route'],
          limit: 5,
        },
      },
      layout: {
        // Position at column 2, row 0
        position: {
          col: 2,
          row: 0,
        },
        // Spans 2 columns and 1 rows
        size: {
          col: 2,
          row: 1,
        }
      }
    },
  ],
}
```

### Example with slotted content

```html
<DashboardRenderer
  :context="context"
  :config="config"
>
  <!-- use the `id` set in the tile config for the slot name -->
  <template #slot-1>
    <div>
      <h3>Custom Slot</h3>
      <p>This is a slotted tile</p>
    </div>
  </template>
</DashboardRenderer>
```

```typescript
import type { DashboardRendererContext, DashboardConfig } from '@kong-ui-public/dashboard-renderer'
import { DashboardRenderer, ChartTypes } from '@kong-ui-public/dashboard-renderer'

const context: DashboardRendererContext = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '15M',
  },
}

const config: DashboardConfig = {
  // 4 x 1 grid
  gridSize: {
    cols: 4,
    rows: 1,
  }
  tiles: [
    {
      // Line chart
      definition: {
        chart: {
          type: ChartTypes.TimeSeriesLine,
        },
        // requests by status code over time
        query: {
          metrics: ['request_count'],
          dimensions: ['status_code', 'time']
        },
      },
      layout: {
        // Position at column 0, row 0
        position: {
          col: 0,
          row: 0,
        },
        // Spans 2 columns and 1 rows
        size: {
          col: 2,
          row: 1,
        }
      }
    },
    {
      // Slottable tile
      definition: {
        chart: {
          type: ChartTypes.Slottable,
          id: 'slot-1' // slot name
        },
        query: {},
      },
      layout: {
        // Position at column 2, row 0
        position: {
          col: 2,
          row: 0,
        },
        // Spans 2 columns and 1 rows
        size: {
          col: 2,
          row: 1,
        }
      }
    },
  ],
}
```
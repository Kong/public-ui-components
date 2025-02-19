# @kong-ui-public/dashboard-renderer

Render Analytics charts on a page from a JSON definition.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Props](#props)
  - [Example](#example)
- [Dashboard Config Schema](#dashboard-config-schema)

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

This component takes two properties:

- [context](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/src/types/renderer-types.ts): The time range that the dashboard should query, any additional filters that should be applied, and editing configuration.
- [config](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/dashboardSchema.ts): The dashboard config and layout.

#### Context Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| filters | [AllFilters[]](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/all.ts) | Yes | - | Filters to be applied to the dashboard |
| timeSpec | [TimeRangeV4](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/common.ts) | No | 7 days | The time range for queries |
| tz | string | No | Local timezone | Timezone for date formatting |
| refreshInterval | number | No | DEFAULT_TILE_REFRESH_INTERVAL_MS | Interval for refreshing tiles |
| editable | boolean | No | false | Enables dashboard editing capabilities |

### Events

The DashboardRenderer component emits the following events when in editable mode:

| Event | Payload | Description |
|-------|---------|-------------|
| `edit-tile` | `GridTile<TileDefinition>` | Emitted when the edit button is clicked on a tile. The payload includes the complete tile configuration including its layout and metadata. |
| `update-tiles` | `TileConfig[]` | Emitted when tiles are moved, resized, or removed. The payload is an array of all tiles with their updated positions and sizes. |
| `remove-tile` | `GridTile<TileDefinition>` | Emitted when a tile is removed via the kebab menu. The payload includes the configuration of the removed tile. |

Example of handling dashboard events:

```typescript
const handleEditTile = (tile: GridTile<TileDefinition>) => {
  // Handle tile editing, e.g., open an edit modal
  console.log('Editing tile:', tile.id)
}

const handleUpdateTiles = (tiles: TileConfig[]) => {
  // Handle layout updates, e.g., save to backend
  console.log('Updated tiles:', tiles)
}

const handleRemoveTile = (tile: GridTile<TileDefinition>) => {
  // Handle tile removal, e.g., update backend
  console.log('Removed tile:', tile.id)
}
```

```html
<DashboardRenderer
  :context="context"
  :config="config"
  @edit-tile="handleEditTile"
  @update-tiles="handleUpdateTiles"
  @remove-tile="handleRemoveTile"
/>
```

Note: These events are only emitted when the dashboard is in editable mode (`context.editable = true`).

### Example

```html
<DashboardRenderer
  :context="context"
  :config="config"
  @edit-tile="handleEditTile"
  @update-tiles="handleUpdateTiles"
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
  editable: true, // Enable editing capabilities
}

const config: DashboardConfig = {
  // 4 x 1 grid
  gridSize: {
    cols: 4,
    rows: 1,
  },
  tiles: [
    {
      id: 'unique-tile-id', // Required for editable dashboards
      definition: {
        chart: {
          type: 'horizontal_bar',
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
          cols: 2,
          rows: 1,
        }
      }
    },
    {
      definition: {
        chart: {
          type: 'top_n',
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
          cols: 2,
          rows: 1,
        }
      }
    },
  ],
}
```

#### Slotted content

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
  },
  tiles: [
    {
      // Line chart
      definition: {
        chart: {
          type: 'timeseries_line',
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
          cols: 2,
          rows: 1,
        }
      }
    },
    {
      // Slottable tile
      definition: {
        chart: {
          type: 'slottable',
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
          cols: 2,
          rows: 1,
        }
      }
    },
  ],
}
```

#### Auto-fit row content

__Note__: _this will only work in non-editable mode_

This example will create a dynamically-sized row that fits to its content rather than being fixed at the configured row height.  Note that this works because each chart is only rendered in 1 row; if a chart has `fitToContent` and `layout.size.rows > 1`, the `fitToContent` setting will be ignored.

Rendering `AnalyticsChart` components (e.g., horizontal bar, vertical bar, timeseries charts) with dynamic row heights may lead to undefined behavior.  This option is best used with non-canvas charts (e.g., TopN charts).


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
  },
  tiles: [
    {
      definition: {
        chart: {
          type: 'top_n',
          chartTitle: 'Top N chart of mock data',
          description: 'Description'
        },
        query: {},
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 1,
          fitToContent: true,
        },
      },
    },
    {
      definition: {
        chart: {
          type: 'top_n',
          chartTitle: 'Top N chart of mock data',
          description: 'Description',
        },
        query: {},
      },
      layout: {
        position: {
          col: 3,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 1,
          fitToContent: true,
        },
      },
    },
  ],
}
```

### Editable Dashboard Example

```typescript
const context: DashboardRendererContext = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '15M',
  },
  editable: true, // Enable editing capabilities
}

const config: DashboardConfig = {
  gridSize: {
    cols: 4,
    rows: 1,
  },
  tiles: [
    {
      id: 'unique-tile-id', // Required for editable dashboards
      definition: {
        chart: {
          type: 'horizontal_bar',
        },
        query: {
          metrics: ['request_count'],
          dimensions: ['route']
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 2,
          rows: 1,
        }
      }
    }
  ]
}
```

```html
<DashboardRenderer
  :context="context"
  :config="config"
  @edit-tile="handleEditTile"
  @update-tiles="handleUpdateTiles"
/>
```

### Editable Dashboard Features

When `editable` is enabled:

#### User Interface Features
- Tiles can be dragged and repositioned using the tile header
- Tiles can be resized using handles in the bottom corners
- Each tile displays an edit button and a kebab menu with additional options
- Tiles can be removed via the kebab menu

#### Events
The following events are emitted during user interactions:
- `edit-tile`: Emitted when the edit button is clicked on a tile
- `update-tiles`: Emitted when tiles are moved, resized, or their layout changes
- `remove-tile`: Emitted when a tile is removed via the kebab menu

Example of handling these events:

```typescript
<DashboardRenderer
  :context="context"
  :config="config"
  @edit-tile="(tile) => handleTileEdit(tile)"
  @update-tiles="(tiles) => handleLayoutUpdate(tiles)"
  @remove-tile="(tile) => handleTileRemoval(tile)"
/>
```

Note: When using editable dashboards, each tile should have a unique `id` property to properly track changes and handle events correctly. If no `id` is provided, one will be generated automatically, but this may lead to unexpected behavior when tracking changes to the tile.

## Dashboard Config Schema

The dashboard configuration schema is defined in `@kong-ui-public/analytics-utilities`.

### Core Types

#### DashboardConfig
The root configuration type for a dashboard.

```typescript
interface DashboardConfig {
  tiles: TileConfig[]          // Array of tile configurations
  tileHeight?: number         // Optional height of each tile in pixels
  gridSize: {                 // Required grid layout configuration
    cols: number             // Number of columns in the grid
    rows: number             // Number of rows in the grid
  }
}
```

#### TileConfig
Configuration for individual dashboard tiles.

```typescript
interface TileConfig {
  definition: TileDefinition   // The tile's chart and query configuration
  layout: TileLayout          // The tile's position and size in the grid
  id?: string                 // Optional unique identifier (required for editable dashboards)
}
```

#### TileDefinition
Configuration for the chart and query within a tile.

```typescript
interface TileDefinition {
  chart: ChartOptions         // Configuration for the chart type and options
  query: ValidDashboardQuery  // Configuration for the data query
}
```

#### ChartOptions
Chart type and options configuration.

```typescript
interface ChartOptions {
  type: DashboardTileType     // The type of chart
  chartTitle?: string        // Optional title for the chart
  syntheticsDataKey?: string  // Optional key for synthetic tests
  allowCsvExport?: boolean    // Optional flag to allow CSV export
  chartDatasetColors?: AnalyticsChartColors | string[]  // Optional custom colors for datasets
}
```

### Chart Types

The following chart types are supported:

- `horizontal_bar`: Horizontal bar chart
- `vertical_bar`: Vertical bar chart
- `gauge`: Gauge chart
- `timeseries_line`: Line chart for time series data
- `timeseries_bar`: Bar chart for time series data
- `golden_signals`: Metric cards showing key performance indicators
- `top_n`: Table showing top N results
- `slottable`: Custom content slot

Each chart type has its own configuration schema with specific options.

### Common Chart Properties

Most chart types support these common properties:
- `chartTitle`: String title for the chart
- `syntheticsDataKey`: Key for synthetic tests (if applicable)
- `allowCsvExport`: Boolean to enable/disable CSV export
- `chartDatasetColors`: Custom colors for datasets (object or array) `{ [key: string]: string } | string[]`

### Query Configuration

[See here](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore) for explore query types.

Queries can be configured for three different data sources:

1. `advanced`: Uses the advanced explore API
2. `basic`: Uses the basic explore API
3. `ai`: Uses the AI explore API

Each query type supports:
- `metrics`: Array of aggregations to collect
- `dimensions`: Array of attributes to group by (max 2)
- `filters`: Array of query filters
- `time_range`: Time range configuration (relative or absolute)
- `granularity`: Time bucket size for temporal queries
- `limit`: Number of results to return

### Time Range Configuration

[See here](https://github.com/Kong/public-ui-components/blob/main/packages/analytics/analytics-utilities/src/types/explore/common.ts) for time range types.

Two types of time ranges are supported:

1. Relative:
```typescript
{
  type: 'relative'
  time_range: string        // e.g., '1h', '7d'
  tz?: string              // Timezone, defaults to 'Etc/UTC'
}
```

2. Absolute:
```typescript
{
  type: 'absolute'
  start: string            // Start timestamp
  end: string             // End timestamp
  tz?: string             // Timezone
}
```

### Layout Configuration

The `TileLayout` type controls tile positioning and sizing:

```typescript
interface TileLayout {
  position: {
    col: number           // Starting column (0-based)
    row: number           // Starting row (0-based)
  }
  size: {
    cols: number         // Number of columns to span
    rows: number         // Number of rows to span
    fitToContent?: boolean // Enable auto-height for the row
  }
}
```

### Usage Example

```typescript
const dashboardConfig: DashboardConfig = {
  gridSize: {
    cols: 4,
    rows: 2
  },
  tiles: [{
    id: 'requests-by-route',
    definition: {
      chart: {
        type: 'horizontal_bar',
        chartTitle: 'Requests by Route'
      },
      query: {
        datasource: 'advanced',
        metrics: ['request_count'],
        dimensions: ['route']
      }
    },
    layout: {
      position: { col: 0, row: 0 },
      size: { cols: 2, rows: 1 }
    }
  }]
}
```

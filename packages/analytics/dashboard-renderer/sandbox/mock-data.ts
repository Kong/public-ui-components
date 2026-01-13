import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { DashboardConfig, TileConfig } from '../src/types'

export const nonTsExploreResponse: ExploreResultV4 = {
  data: [{
    event: { status_code_grouped: '2XX', request_count: 42114 },
    timestamp: '2024-03-05T04:34:00.000Z',
  },
  {
    event: { status_code_grouped: '3XX', request_count: 14147 },
    timestamp: '2024-03-05T04:34:00.000Z',
  },
  {
    event: { status_code_grouped: '4XX', request_count: 13617 },
    timestamp: '2024-03-05T04:34:00.000Z',
  },
  {
    event: { status_code_grouped: '2XX', request_count: 27902 },
    timestamp: '2024-03-05T04:49:00.000Z',
  },
  {
    event: { status_code_grouped: '3XX', request_count: 9080 },
    timestamp: '2024-03-05T04:49:00.000Z',
  },
  {
    event: { status_code_grouped: '4XX', request_count: 26745 },
    timestamp: '2024-03-05T04:49:00.000Z',
  }],
  meta: {
    start: '2024-03-05T04:34:00.000Z',
    end: '2024-03-05T05:04:00.000Z',
    granularity_ms: 900000,
    query_id: 'explore-814be27f-ff3c-470e-9a08-3fsv92vbd',
    metric_names: ['request_count'],
    truncated: false,
    display: {
      status_code_grouped: {
        '2XX': { name: '2XX' },
        '3XX': { name: '3XX' },
        '4XX': { name: '4XX' },
        '5XX': { name: '5XX' },
      },
    },
    metric_units: { request_count: 'count' },
  },
}

export const timeSeriesExploreResponse: ExploreResultV4 = {
  data: [{
    event: { kong_latency_p99: 119, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:43:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:44:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:45:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 12, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:46:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:47:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:48:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:49:00.000Z',
  }, {
    event: { kong_latency_p99: 80, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:50:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 18, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:51:00.000Z',
  }, {
    event: { kong_latency_p99: 119, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:52:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:53:00.000Z',
  }, {
    event: { kong_latency_p99: 103, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:54:00.000Z',
  }, {
    event: { kong_latency_p99: 80, kong_latency_p95: 7, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:55:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 14, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:56:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 35, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:57:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 47, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:58:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 37, kong_latency_p50: 0 },
    timestamp: '2024-01-31T18:59:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 40, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:00:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:01:00.000Z',
  }, {
    event: { kong_latency_p99: 119, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:02:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:03:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:04:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 34, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:05:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 20, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:06:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 37, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:07:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:08:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:09:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 20, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:10:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:11:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 40, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:12:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:13:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:14:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 29, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:15:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:16:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 40, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:17:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:18:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:19:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:20:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:21:00.000Z',
  }, {
    event: { kong_latency_p99: 108, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:22:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:23:00.000Z',
  }, {
    event: { kong_latency_p99: 108, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:24:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:25:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:26:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 50, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:27:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:28:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 50, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:29:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:30:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:31:00.000Z',
  }, {
    event: { kong_latency_p99: 119, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:32:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:33:00.000Z',
  }, {
    event: { kong_latency_p99: 103, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:34:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:35:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:36:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:37:00.000Z',
  }, {
    event: { kong_latency_p99: 119, kong_latency_p95: 49, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:38:00.000Z',
  }, {
    event: { kong_latency_p99: 99, kong_latency_p95: 40, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:39:00.000Z',
  }, {
    event: { kong_latency_p99: 90, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:40:00.000Z',
  }, {
    event: { kong_latency_p99: 49, kong_latency_p95: 10, kong_latency_p50: 0 },
    timestamp: '2024-01-31T19:41:00.000Z',
  }, {
    event: { kong_latency_p99: 31, kong_latency_p95: 12, kong_latency_p50: 1 },
    timestamp: '2024-01-31T19:42:00.000Z',
  }],
  meta: {
    start: '2024-01-31T18:43:00.000Z',
    end: '2024-01-31T19:43:00.000Z',
    granularity_ms: 60000,
    query_id: 'explore-814be27f-ff3c-470e-9a08-9cbf45cc3bb9',
    metric_names: ['kong_latency_p99', 'kong_latency_p95', 'kong_latency_p50'],
    truncated: false,
    display: {},
    metric_units: { kong_latency_p99: 'ms', kong_latency_p95: 'ms', kong_latency_p50: 'ms' },
  },
}

export const summaryDashboardConfig: DashboardConfig = {
  tileHeight: 167,
  tiles: [
    // one 6 x 1 Metric cards
    {
      definition: {
        chart: {
          type: 'golden_signals',
          chartTitle: 'Analytics',
          description: '{timeframe}',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 6,
          rows: 1,
        },
      },
    } as TileConfig,

    // two 3 x 2 Timeseries
    {
      definition: {
        chart: {
          type: 'timeseries_line',
          chartDatasetColors: {
            request_count: '#169FCC',
          },
          chartTitle: 'Total Traffic over Time',
        },
        query: {
          metrics: [
            'request_count',
          ],
          dimensions: [
            'time',
          ],
          filters: [{
            field: 'control_plane',
            operator: 'in',
            value: ['default_uuid'],
          }],
        },
      },
      layout: {
        position: {
          col: 0,
          row: 1,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.
    {
      definition: {
        chart: {
          type: 'timeseries_line',
          chartDatasetColors: {
            response_latency_p99: '#169FCC',
            response_latency_p95: '#1155CB',
            response_latency_p50: '#42D782',
          },
          chartTitle: 'Latency Breakdown over Time',
        },
        query: {
          metrics: [
            'response_latency_p99',
            'response_latency_p95',
            'response_latency_p50',
          ],
          dimensions: [
            'time',
          ],
        },
      },
      layout: {
        position: {
          col: 3,
          row: 1,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
    } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.

    // one 6 x 2 Timeseries
    {
      definition: {
        chart: {
          type: 'timeseries_line',
          chartDatasetColors: {
            upstream_latency_p99: '#169FCC',
            kong_latency_p99: '#1155CB',
          },
          chartTitle: 'Kong vs Upstream Latency over Time',
        },
        query: {
          metrics: [
            'upstream_latency_p99',
            'kong_latency_p99',
          ],
          dimensions: [
            'time',
          ],
        },
      },
      layout: {
        position: {
          col: 0,
          row: 3,
        },
        size: {
          cols: 6,
          rows: 2,
        },
      },
    } as unknown as TileConfig, // TODO: MA-2987: Remove default datasource concept and associated tests.
  ],
}

export const simpleConfigNoFilters: DashboardConfig = {
  tileHeight: 167,
  tiles: [
    // one 6 x 1 Metric cards
    {
      definition: {
        chart: {
          type: 'golden_signals',
          chartTitle: 'Analytics',
          description: '{timeframe}',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 6,
          rows: 1,
        },
      },
    },
    // one 6 x 1 timeseries
    {
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 1,
        },
        size: {
          cols: 6,
          rows: 1,
        },
      },
    },
  ],
}

export const simpleConfigGlobalFilters: DashboardConfig = {
  gridSize: {
    cols: 6,
    rows: 2,
  },
  tileHeight: 167,
  tiles: [
    // 3 x Metric cards
    {
      definition: {
        chart: {
          type: 'golden_signals',
          chartTitle: 'Analytics',
          description: '{timeframe}',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 6,
          rows: 1,
        },
      },
    },
    {
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 1,
        },
        size: {
          cols: 6,
          rows: 1,
        },
      },
    },
  ],
  preset_filters: [{
    field: 'control_plane',
    operator: 'in',
    value: ['default_uuid'],
  }],
}

export const routeExploreResponse: ExploreResultV4 = {
  meta: {
    display: {
      route: {
        'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6': { name: 'GetMeAKongDefault (secondaryRuntime)', deleted: false },
        'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4': { name: 'dp-mock-msg-per-sec-us-dev (default)', deleted: false },
        'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca': { name: '8b1db (default)', deleted: false },
        'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b': { name: 'dp-mock-us-dev (default)', deleted: false },
        'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9': { name: 'GetMeASongRoute (default)', deleted: false },
      },
    },
    end: '2023-08-17T18:00:53.000Z',
    granularity_ms: 300000,
    limit: 50,
    metric_names: [
      'request_count',
    ],
    metric_units: {
      request_count: 'count',
    },
    query_id: '4cc77ce4-6458-49f0-8a7e-443a4312dacd',
    start: '2023-08-17T17:55:53.000Z',
  },
  data: [
    {
      event: {
        request_count: 9483,
        route: 'b486fb30-e058-4b5f-85c2-495ec26ba522:09ba7bc7-58d6-42d5-b9c0-3ffb28b307e6',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
    {
      event: {
        request_count: 5587,
        route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:b4cd1c10-d77f-41b0-a84d-31fc0d99f0d9',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
    {
      event: {
        request_count: 5583,
        route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8b1db7eb-5c3c-489c-9344-eb0b272019ca',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
    {
      event: {
        request_count: 1485,
        route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:8f3f6808-a723-4793-8444-f2046961226b',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
    {
      event: {
        request_count: 309,
        route: 'd5ac5d88-efed-4e10-9dfe-0b0a6646c219:2a3e9d21-804b-4b3b-ab7e-c6f002dadbf4',
      },
      timestamp: '2023-08-17T17:55:53.000Z',
    },
  ],
}

export const fourByFourDashboardConfigJustCharts: DashboardConfig = {
  tileHeight: 167,
  tiles: [
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
      id: 'tile-1',
    },
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 3,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
      id: 'tile-2',
    },
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 4,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
      id: 'tile-3',
    },
    {
      type: 'chart',
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 3,
          row: 4,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
      id: 'tile-4',
    },
  ],
}

export const oneTileDashboardConfig: DashboardConfig = {
  tileHeight: 167,
  tiles: [
    {
      definition: {
        chart: {
          type: 'timeseries_line',
        },
        query: {
          datasource: 'api_usage',
        },
      },
      layout: {
        position: {
          col: 0,
          row: 0,
        },
        size: {
          cols: 3,
          rows: 2,
        },
      },
      id: 'tile-1',
    },
  ],
}

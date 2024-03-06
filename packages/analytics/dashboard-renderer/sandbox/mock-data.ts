import type { ExploreResultV4, ExploreQuery } from '@kong-ui-public/analytics-utilities'
import type { DashboardConfig, TileConfig } from '../src/types'
import { ChartTypes } from '../src/types'

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
    start_ms: 1709613240000,
    end_ms: 1709615040000,
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
    start_ms: 1706726580000,
    end_ms: 1706730180000,
    granularity_ms: 60000,
    query_id: 'explore-814be27f-ff3c-470e-9a08-9cbf45cc3bb9',
    metric_names: ['kong_latency_p99', 'kong_latency_p95', 'kong_latency_p50'],
    truncated: false,
    display: {},
    metric_units: { kong_latency_p99: 'ms', kong_latency_p95: 'ms', kong_latency_p50: 'ms' },
  },
}

export const summaryDashboardConfig: DashboardConfig = {
  gridSize: {
    cols: 6,
    rows: 9,
  },
  tileHeight: 167,
  tiles: [
    // 3 x Metric cards
    {
      definition: {
        chart: {
          type: ChartTypes.GoldenSignals,
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

    // 2 x Timeseries
    {
      definition: {
        chart: {
          type: ChartTypes.TimeseriesLine,
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
            dimension: 'control_plane',
            type: 'in',
            values: ['default_uuid'],
          }],
        } as ExploreQuery,
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
    } as unknown as TileConfig,
    {
      definition: {
        chart: {
          type: ChartTypes.TimeseriesLine,
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
        } as unknown as ExploreQuery,
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
    } as unknown as TileConfig,

    // 1 x Timeseries
    {
      definition: {
        chart: {
          type: ChartTypes.TimeseriesLine,
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
        } as ExploreQuery,
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
    } as unknown as TileConfig,
  ],
}

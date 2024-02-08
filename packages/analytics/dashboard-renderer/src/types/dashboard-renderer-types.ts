import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import { DEFAULT_TILE_HEIGHT } from '../constants'
import type { ExploreFilter, ExploreQuery, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'

export interface DashboardRendererContext {
  filters: ExploreFilter[]
  timeSpec: TimeRangeV4
}

export enum ChartTypes {
  HorizontalBar = 'horizontal_bar',
  VerticalBar = 'vertical_bar',
  Gauge = 'gauge',
  TimeseriesLine = 'timeseries_line',
  GoldenSignals = 'golden_signals',
}

// Common definition for many ChartJS tiles.
const syntheticsDataKey = {
  type: 'string',
} as const

const chartDatasetColorsSchema = {
  type: ['object', 'array'],
  items: {
    type: 'string',
  },
  additionalProperties: {
    type: 'string',
  },
} as const satisfies JSONSchema

export const barChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: [ChartTypes.HorizontalBar, ChartTypes.VerticalBar],
    },
    stacked: {
      type: 'boolean',
    },
    showAnnotations: {
      type: 'boolean',
    },
    chartDatasetColors: chartDatasetColorsSchema,
    syntheticsDataKey,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type BarChartOptions = FromSchema<typeof barChartSchema>

export const timeseriesChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: [ChartTypes.TimeseriesLine],
    },
    stacked: {
      type: 'boolean',
    },
    fill: {
      type: 'boolean',
    },
    chartDatasetColors: chartDatasetColorsSchema,
    syntheticsDataKey,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TimeseriesChartOptions = FromSchema<typeof timeseriesChartSchema>

export const gaugeChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: [ChartTypes.Gauge],
    },
    metricDisplay: {
      type: 'string',
      enum: Object.values(ChartMetricDisplay),
    },
    reverseDataset: {
      type: 'boolean',
    },
    numerator: {
      type: 'number',
    },
    syntheticsDataKey,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type GaugeChartOptions = FromSchema<typeof gaugeChartSchema>

export const metricCardSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: [ChartTypes.GoldenSignals],
    },
    longCardTitles: {
      type: 'boolean',
    },
    description: {
      type: 'string',
    },
  },
  required: ['type'],
} as const satisfies JSONSchema

export type MetricCardOptions = FromSchema<typeof metricCardSchema>

const exploreV4FilterSchema = {
  type: 'object',
  description: 'A filter that specifies which data to include in the query',
  properties: {
    dimension: {
      type: 'string',
      enum: [
        'api_product',
        'api_product_version',
        'application',
        'consumer',
        'control_plane',
        'control_plane_group',
        'data_plane_node',
        'gateway_service',
        'route',
        'status_code',
        'status_code_grouped',
        'time',
      ],
    },
    type: {
      type: 'string',
      enum: [
        'in',
        'not_in',
        'selector',
      ],
    },
    values: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: [
    'dimension',
    'type',
    'values',
  ],
} as const satisfies JSONSchema

const exploreV4RelativeTimeSchema = {
  type: 'object',
  properties: {
    tz: {
      type: 'string',
      default: 'Etc/UTC',
    },
    type: {
      type: 'string',
      enum: [
        'relative',
      ],
    },
    time_range: {
      type: 'string',
      enum: [
        '15m',
        '1h',
        '6h',
        '12h',
        '24h',
        '7d',
        '30d',
        'current_week',
        'current_month',
        'previous_week',
        'previous_month',
      ],
      default: '1h',
    },
  },
  required: [
    'type',
    'time_range',
  ],
} as const satisfies JSONSchema

const exploreV4AbsoluteTimeSchema = {
  type: 'object',
  description: 'A duration representing an exact start and end time.',
  properties: {
    tz: {
      type: 'string',
      default: 'Etc/UTC',
    },
    type: {
      type: 'string',
      enum: [
        'absolute',
      ],
    },
    start: {
      type: 'string',
    },
    end: {
      type: 'string',
    },
  },
  required: [
    'type',
  ],
} as const satisfies JSONSchema

export const exploreV4QuerySchema = {
  type: 'object',
  description: 'A query to launch at the API',
  properties: {
    metrics: {
      type: 'array',
      description: 'List of aggregated metrics to collect across the requested time span.',
      items: {
        type: 'string',
        enum: [
          'request_count',
          'request_per_minute',
          'response_latency_p99',
          'response_latency_p95',
          'response_latency_p50',
          'response_latency_average',
          'upstream_latency_p99',
          'upstream_latency_p95',
          'upstream_latency_p50',
          'upstream_latency_average',
          'kong_latency_p99',
          'kong_latency_p95',
          'kong_latency_p50',
          'kong_latency_average',
          'response_size_p99',
          'response_size_p95',
          'response_size_p50',
          'request_size_p99',
          'request_size_p95',
          'request_size_p50',
          'request_size_average',
          'response_size_average',
        ],
      },
    },
    dimensions: {
      type: 'array',
      description: 'List of attributes or entity types to group by.',
      minItems: 0,
      maxItems: 2,
      items: {
        type: 'string',
        enum: [
          'api_product',
          'api_product_version',
          'application',
          'consumer',
          'control_plane',
          'control_plane_group',
          'data_plane_node',
          'gateway_service',
          'route',
          'status_code',
          'status_code_grouped',
          'time',
        ],
      },
    },
    filters: {
      type: 'array',
      description: 'A list of filters to apply to the query.',
      items: exploreV4FilterSchema,
    },
    granularity_ms: {
      type: 'number',
      description: 'Force time grouping into buckets of this duration in milliseconds. Only has an effect if "time" is in the "dimensions" list.',
      minimum: 60000,
    },
    time_range: {
      description: 'The time range to query.',
      oneOf: [
        exploreV4RelativeTimeSchema,
        exploreV4AbsoluteTimeSchema,
      ],
      default: {
        type: 'relative',
        time_range: '1h',
      },
    },
    meta: {
      type: 'object',
    },
  },
} as const satisfies JSONSchema

export const tileDefinitionSchema = {
  type: 'object',
  properties: {
    query: exploreV4QuerySchema,
    chart: {
      oneOf: [barChartSchema, gaugeChartSchema, timeseriesChartSchema, metricCardSchema],
    },
  },
  required: ['query', 'chart'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileDefinition = FromSchema<typeof tileDefinitionSchema>

export const tileLayoutSchema = {
  type: 'object',
  properties: {
    position: {
      type: 'object',
      properties: {
        col: {
          type: 'number',
        },
        row: {
          type: 'number',
        },
      },
      description: 'Position of the tile in the grid.',
      required: ['col', 'row'],
      additionalProperties: false,
    },
    size: {
      type: 'object',
      properties: {
        cols: {
          type: 'number',
        },
        rows: {
          type: 'number',
        },
      },
      description: 'Number of columns and rows the tile occupies.',
      required: ['cols', 'rows'],
      additionalProperties: false,
    },
  },
  required: ['position', 'size'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileLayout = FromSchema<typeof tileLayoutSchema>

export const tileConfigSchema = {
  type: 'object',
  properties: {
    definition: tileDefinitionSchema,
    layout: tileLayoutSchema,
  },
  required: ['definition', 'layout'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileConfig = FromSchema<typeof tileConfigSchema>

export const dashboardConfigSchema = {
  type: 'object',
  properties: {
    tiles: {
      type: 'array',
      items: tileConfigSchema,
    },
    tileHeight: {
      type: 'number',
      description: `Height of each tile in pixels. Default: ${DEFAULT_TILE_HEIGHT}`,
    },
    gridSize: {
      type: 'object',
      properties: {
        cols: {
          type: 'number',
        },
        rows: {
          type: 'number',
        },
      },
      description: 'Number of columns and rows in the grid.',
      required: ['cols', 'rows'],
      additionalProperties: false,
    },
  },
  required: ['tiles', 'gridSize'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type DashboardConfig = FromSchema<typeof dashboardConfigSchema>

export interface RendererProps<T> {
  query: ExploreQuery
  queryReady: boolean
  chartOptions: T
  height: number
}

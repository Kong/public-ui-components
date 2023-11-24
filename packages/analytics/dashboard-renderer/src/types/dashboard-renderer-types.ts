import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import { DEFAULT_TILE_HEIGHT, DEFAULT_TILE_WIDTH } from '../constants'

// TODO: Explore v4
export interface DashboardRendererContext {
  filters: any
  timeSpec: any
}

export enum ChartTypes {
  HorizontalBar = 'horizontal_bar',
  VerticalBar = 'vertical_bar',
  Gauge = 'gauge',
  TimeseriesLine = 'timeseries_line',
}

// Common definition for many ChartJS tiles.
const syntheticsDataKey = {
  type: 'string',
} as const

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
    syntheticsDataKey,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TimeseriesChartOptions = FromSchema<typeof barChartSchema>

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

export const tileSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    query: {
      // TODO: JSON Schema for Explore v4.
      type: 'object',
    },
    chart: {
      oneOf: [barChartSchema, gaugeChartSchema, timeseriesChartSchema],
    },
    title: {
      type: 'string',
    },
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
  required: ['chart', 'query', 'position', 'size', 'id'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileDefinition = FromSchema<typeof tileSchema>

export const dashboardDefinitionSchema = {
  type: 'object',
  properties: {
    tiles: {
      type: 'array',
      items: tileSchema,
    },
    tileHeight: {
      type: 'number',
      description: `Height of each tile in pixels. Default: ${DEFAULT_TILE_HEIGHT}`,
      default: DEFAULT_TILE_HEIGHT,
    },
    tileWidth: {
      type: 'number',
      description: `Width of each tile in pixels. Default: ${DEFAULT_TILE_WIDTH}`,
      default: DEFAULT_TILE_WIDTH,
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

export type DashboardDefinition = FromSchema<typeof dashboardDefinitionSchema>

export interface RendererProps<T> {
  query: any // TODO: Explore v4
  queryReady: boolean
  chartOptions: T
  height: number
}

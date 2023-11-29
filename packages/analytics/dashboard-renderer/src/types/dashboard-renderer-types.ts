import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import { DEFAULT_TILE_HEIGHT } from '../constants'

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
    showAnnotations: {
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
    fill: {
      type: 'boolean',
    },
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

export const tileDefinitionSchema = {
  type: 'object',
  properties: {
    query: {
      // TODO: JSON Schema for Explore v4.
      type: 'object',
    },
    chart: {
      oneOf: [barChartSchema, gaugeChartSchema, timeseriesChartSchema],
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
      default: DEFAULT_TILE_HEIGHT,
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
  query: any // TODO: Explore v4
  queryReady: boolean
  chartOptions: T
  height: number
}

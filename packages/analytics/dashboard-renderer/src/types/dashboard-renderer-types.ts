import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'

// TODO: Explore v4
export interface DashboardRendererContext {
  filters: any
  timeSpec: any
}

export enum ChartTypes {
  HorizontalBar = 'horizontal_bar',
  VerticalBar = 'vertical_bar',
  Gauge = 'gauge',
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
    query: {
      // TODO: JSON Schema for Explore v4.
      type: 'object',
    },
    chart: {
      oneOf: [barChartSchema, gaugeChartSchema],
    },
    title: {
      type: 'string',
    },
  },
  required: ['chart', 'query'],
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
  },
  required: ['tiles'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type DashboardDefinition = FromSchema<typeof dashboardDefinitionSchema>

export interface RendererProps<T> {
  query: any // TODO: Explore v4
  queryReady: boolean,
  chartOptions: T,
}

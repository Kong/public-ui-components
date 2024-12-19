import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'
import { DEFAULT_TILE_HEIGHT } from '../constants'
import type { AllFilters, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import {
  aiExploreAggregations,
  basicExploreAggregations,
  exploreAggregations,
  exploreFilterTypesV2,
  filterableAiExploreDimensions,
  filterableBasicExploreDimensions,
  filterableExploreDimensions,
  granularityValues,
  queryableAiExploreDimensions,
  queryableBasicExploreDimensions,
  queryableExploreDimensions,
  relativeTimeRangeValuesV4,
  requestFilterTypeEmptyV2,
} from '@kong-ui-public/analytics-utilities'

export interface DashboardRendererContext {
  filters: AllFilters[]
  timeSpec?: TimeRangeV4
  tz?: string
  refreshInterval?: number
  editable?: boolean
}

type FromSchemaWithOptions<T extends JSONSchema> = FromSchema<T, { keepDefaultedPropertiesOptional: true }>

// The DashboardRenderer component fills in optional values before passing them down to the tile renderers.
export type DashboardRendererContextInternal = Required<DashboardRendererContext>

// TODO: Once we support all chart types, this could potentially be replaced with a direct reference to `chartTypes`.
// This is partially overlapping with analytics chart types, but not strictly so.
export const dashboardTileTypes = [
  'horizontal_bar',
  'vertical_bar',
  'gauge',
  'timeseries_line',
  'timeseries_bar',
  'golden_signals',
  'top_n',
  'slottable',
] as const
export type DashboardTileType = typeof dashboardTileTypes[number]

// Common definition for many ChartJS tiles.
const syntheticsDataKey = {
  type: 'string',
} as const

const chartTitle = {
  type: 'string',
} as const

const allowCsvExport = {
  type: 'boolean',
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

export const slottableSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['slottable'],
    },
    id: {
      type: 'string',
    },
  },
  required: ['type', 'id'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type SlottableOptions = FromSchemaWithOptions<typeof slottableSchema>

export const barChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['horizontal_bar', 'vertical_bar'],
    },
    stacked: {
      type: 'boolean',
    },
    chartDatasetColors: chartDatasetColorsSchema,
    syntheticsDataKey,
    chartTitle,
    allowCsvExport,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type BarChartOptions = FromSchemaWithOptions<typeof barChartSchema>

export const timeseriesChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['timeseries_line', 'timeseries_bar'],
    },
    stacked: {
      type: 'boolean',
    },
    threshold: {
      type: 'object',
      additionalProperties: {
        type: 'number',
      },
    },
    chartDatasetColors: chartDatasetColorsSchema,
    syntheticsDataKey,
    chartTitle,
    allowCsvExport,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TimeseriesChartOptions = FromSchemaWithOptions<typeof timeseriesChartSchema>

export const gaugeChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['gauge'],
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
    chartTitle,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type GaugeChartOptions = FromSchemaWithOptions<typeof gaugeChartSchema>

export const topNTableSchema = {
  type: 'object',
  properties: {
    chartTitle,
    syntheticsDataKey,
    type: {
      type: 'string',
      enum: ['top_n'],
    },
    description: {
      type: 'string',
    },
    entityLink: {
      type: 'string',
    },
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TopNTableOptions = FromSchemaWithOptions<typeof topNTableSchema>

export const metricCardSchema = {
  type: 'object',
  properties: {
    chartTitle,
    type: {
      type: 'string',
      enum: ['golden_signals'],
    },
    longCardTitles: {
      type: 'boolean',
    },
    description: {
      type: 'string',
    },
    percentileLatency: {
      type: 'boolean',
    },
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type MetricCardOptions = FromSchemaWithOptions<typeof metricCardSchema>

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
      enum: relativeTimeRangeValuesV4,
      default: '1h',
    },
  },
  required: [
    'type',
    'time_range',
  ],
  additionalProperties: false,
} as const satisfies JSONSchema

const exploreV4AbsoluteTimeSchema = {
  type: 'object',
  description: 'A duration representing an exact start and end time.',
  properties: {
    tz: {
      type: 'string',
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
    'start',
    'end',
  ],
  additionalProperties: false,
} as const satisfies JSONSchema

const baseQueryProperties = {
  granularity: {
    type: 'string',
    description: 'Force time grouping into buckets of this duration. Only has an effect if "time" is in the "dimensions" list.',
    enum: granularityValues,
  },
  time_range: {
    type: 'object',
    description: 'The time range to query.',
    anyOf: [
      exploreV4RelativeTimeSchema,
      exploreV4AbsoluteTimeSchema,
    ],
    default: {
      type: 'relative',
      time_range: '1h',
    },
  },
  limit: {
    type: 'number',
  },
  meta: {
    type: 'object',
  },
} as const

const metricsFn = <T extends readonly string[]>(aggregations: T) => ({
  type: 'array',
  description: 'List of aggregated metrics to collect across the requested time span.',
  items: {
    type: 'string',
    enum: aggregations,
  },
} as const satisfies JSONSchema)

const dimensionsFn = <T extends readonly string[]>(dimensions: T) => ({
  type: 'array',
  description: 'List of attributes or entity types to group by.',
  minItems: 0,
  maxItems: 2,
  items: {
    type: 'string',
    enum: dimensions,
  },
} as const satisfies JSONSchema)

const filtersFn = <T extends readonly string[]>(filterableDimensions: T) => ({
  type: 'array',
  description: 'A list of filters to apply to the query',
  items: {
    oneOf: [
      {
        type: 'object',
        description: 'A filter that specifies which data to include in the query',
        properties: {
          dimension: {
            type: 'string',
            enum: filterableDimensions,
          },
          type: {
            type: 'string',
            enum: exploreFilterTypesV2,
          },
          values: {
            type: 'array',
            items: {
              type: ['string', 'number', 'null'],
            },
          },
        },
        required: [
          'dimension',
          'type',
          'values',
        ],
        additionalProperties: false,
      },
      {
        type: 'object',
        description: 'In filter',
        properties: {
          field: {
            type: 'string',
            enum: filterableDimensions,
          },
          operator: {
            type: 'string',
            enum: exploreFilterTypesV2,
          },
          value: {
            type: 'array',
            items: {
              type: ['string', 'number', 'null'],
            },
          },
        },
        required: [
          'field',
          'operator',
          'value',
        ],
        additionalProperties: false,
      },
      {
        type: 'object',
        description: 'Empty filter',
        properties: {
          field: {
            type: 'string',
            enum: filterableDimensions,
          },
          operator: {
            type: 'string',
            enum: requestFilterTypeEmptyV2,
          },
        },
        required: [
          'field',
          'operator',
        ],
        additionalProperties: false,
      },
    ],
  },
} as const satisfies JSONSchema)

export const exploreV4QuerySchema = {
  type: 'object',
  description: 'A query to launch at the advanced explore API',
  properties: {
    datasource: {
      type: 'string',
      enum: [
        'advanced',
      ],
    },
    metrics: metricsFn(exploreAggregations),
    dimensions: dimensionsFn(queryableExploreDimensions),
    filters: filtersFn(filterableExploreDimensions),
    ...baseQueryProperties,
  },
  required: ['datasource'],
  additionalProperties: false,
} as const satisfies JSONSchema

export const basicQuerySchema = {
  type: 'object',
  description: 'A query to launch at the basic explore API',
  properties: {
    datasource: {
      type: 'string',
      enum: [
        'basic',
      ],
    },
    metrics: metricsFn(basicExploreAggregations),
    dimensions: dimensionsFn(queryableBasicExploreDimensions),
    filters: filtersFn(filterableBasicExploreDimensions),
    ...baseQueryProperties,
  },
  required: ['datasource'],
  additionalProperties: false,
} as const satisfies JSONSchema

export const aiQuerySchema = {
  type: 'object',
  description: 'A query to launch at the AI explore API',
  properties: {
    datasource: {
      type: 'string',
      enum: [
        'ai',
      ],
    },
    metrics: metricsFn(aiExploreAggregations),
    dimensions: dimensionsFn(queryableAiExploreDimensions),
    filters: filtersFn(filterableAiExploreDimensions),
    ...baseQueryProperties,
  },
  required: ['datasource'],
  additionalProperties: false,
} as const satisfies JSONSchema

export const validDashboardQuery = {
  anyOf: [exploreV4QuerySchema, basicQuerySchema, aiQuerySchema],
} as const satisfies JSONSchema

export type ValidDashboardQuery = FromSchemaWithOptions<typeof validDashboardQuery>

// Note: `datasource` may need to end up somewhere else for sane type definitions?
export const tileDefinitionSchema = {
  type: 'object',
  properties: {
    query: validDashboardQuery,
    chart: {
      anyOf: [barChartSchema, gaugeChartSchema, timeseriesChartSchema, metricCardSchema, topNTableSchema, slottableSchema],
    },
  },
  required: ['query', 'chart'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileDefinition = FromSchemaWithOptions<typeof tileDefinitionSchema>

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
        fitToContent: {
          type: 'boolean',
        },
      },
      description: 'Number of columns and rows the tile occupies.  If fitToContent is true for every tile in a row, ' +
        'and each tile only occupies 1 row, then the row will auto-fit to its content.',
      required: ['cols', 'rows'],
      additionalProperties: false,
    },
  },
  required: ['position', 'size'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileLayout = FromSchemaWithOptions<typeof tileLayoutSchema>

export const tileConfigSchema = {
  type: 'object',
  properties: {
    definition: tileDefinitionSchema,
    layout: tileLayoutSchema,
  },
  required: ['definition', 'layout'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type TileConfig = FromSchemaWithOptions<typeof tileConfigSchema>

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

export type DashboardConfig = FromSchemaWithOptions<typeof dashboardConfigSchema>

export interface RendererProps<T> {
  query: ValidDashboardQuery
  context: DashboardRendererContextInternal
  queryReady: boolean
  chartOptions: T
  height: number
  refreshCounter: number
}

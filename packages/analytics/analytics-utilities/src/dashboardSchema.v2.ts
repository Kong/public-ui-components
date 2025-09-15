import type { FromSchema, JSONSchema } from 'json-schema-to-ts'
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
} from './types'
import { countryISOA2 } from './types/country-codes'

type FromSchemaWithOptions<T extends JSONSchema> = FromSchema<T, { keepDefaultedPropertiesOptional: true }>

// TODO: Once we support all chart types, this could potentially be replaced with a direct reference to `chartTypes`.
// This is partially overlapping with analytics chart types, but not strictly so.
export const dashboardTileTypes = [
  'horizontal_bar',
  'vertical_bar',
  'gauge',
  'donut',
  'timeseries_line',
  'timeseries_bar',
  'golden_signals',
  'top_n',
  'slottable',
  'single_value',
  'choropleth_map',
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
    chart_dataset_colors: chartDatasetColorsSchema,
    synthetics_data_key: syntheticsDataKey,
    chart_title: chartTitle,
    allow_csv_export: allowCsvExport,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type BarChartOptions = FromSchemaWithOptions<typeof barChartSchema>

export const thresholdSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['warning', 'error', 'neutral'],
    },
    value: {
      type: 'number',
    },
    label: {
      type: 'string',
    },
  },
  required: ['type', 'value'],
  additionalProperties: false,
} as const satisfies JSONSchema

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
        type: 'array',
        items: thresholdSchema,
      },
    },
    chart_dataset_colors: chartDatasetColorsSchema,
    synthetics_data_key: syntheticsDataKey,
    chart_title: chartTitle,
    allow_csv_export: allowCsvExport,
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
    metric_display: {
      type: 'string',
      enum: ['hidden', 'single', 'full'], // This matches the SimpleChartMetricDisplay type.
    },
    reverse_dataset: {
      type: 'boolean',
    },
    numerator: {
      type: 'number',
    },
    synthetics_data_key: syntheticsDataKey,
    chart_title: chartTitle,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type GaugeChartOptions = FromSchemaWithOptions<typeof gaugeChartSchema>

export const donutChartSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['donut'],
    },
    synthetics_data_key: syntheticsDataKey,
    chart_title: chartTitle,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type DonutChartOptions = FromSchemaWithOptions<typeof donutChartSchema>

export const topNTableSchema = {
  type: 'object',
  properties: {
    chart_title: chartTitle,
    synthetics_data_key: syntheticsDataKey,
    type: {
      type: 'string',
      enum: ['top_n'],
    },
    description: {
      type: 'string',
    },
    entity_link: {
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
    chart_title: chartTitle,
    type: {
      type: 'string',
      enum: ['golden_signals'],
    },
    long_card_titles: {
      type: 'boolean',
    },
    description: {
      type: 'string',
    },
    percentile_latency: {
      type: 'boolean',
    },
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type MetricCardOptions = FromSchemaWithOptions<typeof metricCardSchema>

export const singleValueSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['single_value'],
    },
    decimal_points: {
      type: 'number',
    },
    chart_title: chartTitle,
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type SingleValueOptions = FromSchemaWithOptions<typeof singleValueSchema>

export const choroplethMapSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['choropleth_map'],
    },
    chart_title: chartTitle,
    fit_to_country: {
      type: 'string',
      enum: countryISOA2,
    },
    legend: {
      type: 'boolean',
      default: false,
    },
    bounds: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: {
        type: 'array',
        minItems: 2,
        maxItems: 2,
        items: [
          { type: 'number', minimum: -180, maximum: 180 },
          { type: 'number', minimum: -90, maximum: 90 },
        ],
      },
    },
  },
  required: ['type'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type ChoroplethMapOptions = FromSchemaWithOptions<typeof choroplethMapSchema>

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

export const apiUsageQuerySchema = {
  type: 'object',
  description: 'A query to launch at the advanced explore API',
  properties: {
    datasource: {
      type: 'string',
      enum: [
        'api_usage',
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

export const llmUsageSchema = {
  type: 'object',
  description: 'A query to launch at the AI explore API',
  properties: {
    datasource: {
      type: 'string',
      enum: [
        'llm_usage',
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
  anyOf: [apiUsageQuerySchema, basicQuerySchema, llmUsageSchema],
} as const satisfies JSONSchema

export type ValidDashboardQuery = FromSchemaWithOptions<typeof validDashboardQuery>

// Note: `datasource` may need to end up somewhere else for sane type definitions?
export const tileDefinitionSchema = {
  type: 'object',
  properties: {
    query: validDashboardQuery,
    chart: {
      anyOf: [
        barChartSchema,
        gaugeChartSchema,
        donutChartSchema,
        timeseriesChartSchema,
        metricCardSchema,
        topNTableSchema,
        slottableSchema,
        singleValueSchema,
        choroplethMapSchema,
      ],
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
        fit_to_content: {
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
    type: {
      type: 'string',
      enum: ['chart'],
    },
    definition: tileDefinitionSchema,
    layout: tileLayoutSchema,
    id: {
      type: 'string',
      description: 'Unique identifier for the tile.  If not provided, one will be generated.',
    },
  },
  required: ['type', 'definition', 'layout'],
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
    tile_height: {
      type: 'number',
      description: 'Height of each tile in pixels.',
    },
    preset_filters: filtersFn([...new Set([...filterableExploreDimensions, ...filterableBasicExploreDimensions, ...filterableAiExploreDimensions])]),
    template_id: {
      type: ['string', 'null'],
      description: 'Template id which was used to instantiate this dashboard.',
    },
  },
  required: ['tiles'],
  additionalProperties: false,
} as const satisfies JSONSchema

export type DashboardConfig = FromSchemaWithOptions<typeof dashboardConfigSchema>

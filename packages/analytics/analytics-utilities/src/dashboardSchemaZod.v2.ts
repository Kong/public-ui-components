import { z } from 'zod'
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
] as const
export type DashboardTileType = typeof dashboardTileTypes[number]

// Common chart props
const zSyntheticsDataKey = z.string()
const zChartTitle = z.string()
const zAllowCsvExport = z.boolean()

// Can be either an array of strings or a { [key: string]: string } mapping
const zChartDatasetColors = z.union([z.array(z.string()), z.record(z.string(), z.string())])

// Chart schemas
export const zSlottableSchema = z.object({
  type: z.literal('slottable'),
  id: z.string(),
}).strict()
export type SlottableOptions = z.infer<typeof zSlottableSchema>

export const zBarChartSchema = z.object({
  type: z.enum(['horizontal_bar', 'vertical_bar'] as const),
  stacked: z.boolean().optional(),
  chart_dataset_colors: zChartDatasetColors.optional(),
  synthetics_data_key: zSyntheticsDataKey.optional(),
  chart_title: zChartTitle.optional(),
  allow_csv_export: zAllowCsvExport.optional(),
}).strict()
export type BarChartOptions = z.infer<typeof zBarChartSchema>

export const zTimeseriesChartSchema = z.object({
  type: z.enum(['timeseries_line', 'timeseries_bar'] as const),
  stacked: z.boolean().optional(),
  threshold: z.record(z.string(), z.number()).optional(),
  chart_dataset_colors: zChartDatasetColors.optional(),
  synthetics_data_key: zSyntheticsDataKey.optional(),
  chart_title: zChartTitle.optional(),
  allow_csv_export: zAllowCsvExport.optional(),
}).strict()
export type TimeseriesChartOptions = z.infer<typeof zTimeseriesChartSchema>

export const zGaugeChartSchema = z.object({
  type: z.literal('gauge'),
  metric_display: z.enum(['hidden', 'single', 'full'] as const).optional(),
  reverse_dataset: z.boolean().optional(),
  numerator: z.number().optional(),
  synthetics_data_key: zSyntheticsDataKey.optional(),
  chart_title: zChartTitle.optional(),
}).strict()
export type GaugeChartOptions = z.infer<typeof zGaugeChartSchema>

export const zDonutChartSchema = z.object({
  type: z.literal('donut'),
  synthetics_data_key: zSyntheticsDataKey.optional(),
  chart_title: zChartTitle.optional(),
}).strict()
export type DonutChartOptions = z.infer<typeof zDonutChartSchema>

export const zTopNTableSchema = z.object({
  type: z.literal('top_n'),
  chart_title: zChartTitle.optional(),
  synthetics_data_key: zSyntheticsDataKey.optional(),
  description: z.string().optional(),
  entity_link: z.string().optional(),
}).strict()
export type TopNTableOptions = z.infer<typeof zTopNTableSchema>

export const zMetricCardSchema = z.object({
  type: z.literal('golden_signals'),
  chart_title: zChartTitle.optional(),
  long_card_titles: z.boolean().optional(),
  description: z.string().optional(),
  percentile_latency: z.boolean().optional(),
}).strict()
export type MetricCardOptions = z.infer<typeof zMetricCardSchema>

export const zSingleValueSchema = z.object({
  type: z.literal('single_value'),
  decimal_points: z.number().optional(),
  chart_title: zChartTitle.optional(),
}).strict()
export type SingleValueOptions = z.infer<typeof zSingleValueSchema>

const zChartOptions = z.discriminatedUnion('type', [
  zBarChartSchema,
  zGaugeChartSchema,
  zDonutChartSchema,
  zTimeseriesChartSchema,
  zMetricCardSchema,
  zTopNTableSchema,
  zSlottableSchema,
  zSingleValueSchema,
])

export type ChartOptions = z.infer<typeof zChartOptions>

const zExploreV4RelativeTime = z.object({
  tz: z.string().optional().default('Etc/UTC'),
  type: z.literal('relative'),
  time_range: z.enum(relativeTimeRangeValuesV4).optional().default('1h'),
}).strict()

const zExploreV4AbsoluteTime = z.object({
  tz: z.string().optional(),
  type: z.literal('absolute'),
  start: z.string(),
  end: z.string(),
}).strict()

const zTimeRange = z.discriminatedUnion('type', [zExploreV4RelativeTime, zExploreV4AbsoluteTime]).optional().default({
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  type: 'relative',
  time_range: '1h',
})

// Query helpers
const zBaseQuery = z.object({
  granularity: z.enum(granularityValues).optional(),
  time_range: zTimeRange.optional(),
  limit: z.number().optional(),
  meta: z.object().optional(),
})

// metrics(dimensions) helpers
const zMetrics = (aggs: readonly string[]) => z.array(z.enum(aggs as [string, ...string[]])).optional()
const zDimensions = (dims: readonly string[]) => z.array(z.enum(dims as [string, ...string[]])).max(2).optional()

// Filters helper: supports "in" and "empty" operators for a given field enum or union
const zFilters = <T extends readonly string[]>(filterableDimensions: T) => {
  const zInFilter = z.object({
    field: z.enum(filterableDimensions),
    operator: z.enum(exploreFilterTypesV2),
    value: z.array(z.union([z.string(), z.number(), z.null()])),
  }).strict()

  const zEmptyFilter = z.object({
    field: z.enum(filterableDimensions),
    operator: z.enum(requestFilterTypeEmptyV2),
  }).strict()

  return z.array(z.discriminatedUnion('operator', [zInFilter, zEmptyFilter])).optional()
}

// Query schemas (per datasource)
export const zApiUsageQuery = zBaseQuery.extend({
  datasource: z.literal('api_usage'),
  metrics: zMetrics(exploreAggregations).optional(),
  dimensions: zDimensions(queryableExploreDimensions).optional(),
  filters: zFilters(filterableExploreDimensions).optional(),
}).strict()
export const zBasicQuery = zBaseQuery.extend({
  datasource: z.literal('basic'),
  metrics: zMetrics(basicExploreAggregations).optional(),
  dimensions: zDimensions(queryableBasicExploreDimensions).optional(),
  filters: zFilters(filterableBasicExploreDimensions).optional(),
}).strict()
export const zLlmUsageQuery = zBaseQuery.extend({
  datasource: z.literal('llm_usage'),
  metrics: zMetrics(aiExploreAggregations).optional(),
  dimensions: zDimensions(queryableAiExploreDimensions).optional(),
  filters: zFilters(filterableAiExploreDimensions).optional(),
}).strict()

export const zValidDashboardQuery = z.discriminatedUnion('datasource', [zApiUsageQuery, zBasicQuery, zLlmUsageQuery])
export type ValidDashboardQuery = z.infer<typeof zValidDashboardQuery>

// Tile definition/layout/config schemas
export const zTileDefinition = z.object({
  query: zValidDashboardQuery,
  chart: zChartOptions,
}).strict()
export type TileDefinition = z.infer<typeof zTileDefinition>

export const zTileLayout = z.object({
  position: z.object({
    col: z.number(),
    row: z.number(),
  }).strict(),
  size: z.object({
    cols: z.number(),
    rows: z.number(),
    fit_to_content: z.boolean().optional(),
  }).strict(),
}).strict()
export type TileLayout = z.infer<typeof zTileLayout>

export const zTileConfig = z.object({
  type: z.enum(['chart']),
  definition: zTileDefinition,
  layout: zTileLayout,
  id: z.string().optional(),
}).strict()
export type TileConfig = z.infer<typeof zTileConfig>

export const zDashboardConfig = z.object({
  tiles: z.array(zTileConfig),
  tile_height: z.number().optional(),
  preset_filters: zFilters([
    ...filterableExploreDimensions,
    ...filterableBasicExploreDimensions,
    ...filterableAiExploreDimensions,
  ]),
  template_id: z.string().nullable().optional(),
}).strict()
export type DashboardConfig = z.infer<typeof zDashboardConfig>

export const parseDashboardConfig = (input: unknown) => zDashboardConfig.parse(input)

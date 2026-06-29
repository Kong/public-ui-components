import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import {
  apiUsageQuerySchema,
  barChartSchema,
  basicQuerySchema,
  dashboardConfigSchema,
  llmUsageSchema,
  agenticUsageSchema,
  validDashboardChartQuery,
  validDashboardQuery,
  validDashboardTableQuery,
  platformQuerySchema,
  filterablePlatformPresetFilterDimensions,
} from './dashboardSchema.v2'
import {
  agenticExploreAggregations,
  aiExploreAggregations,
  basicExploreAggregations,
  exploreAggregations,
  exploreFilterTypesV2,
  filterableAgenticExploreDimensions,
  filterableAiExploreDimensions,
  filterableBasicExploreDimensions,
  filterableExploreDimensions,
  queryableAgenticExploreDimensions,
  queryableAiExploreDimensions,
  queryableBasicExploreDimensions,
  queryableExploreDimensions,
  requestFilterTypeEmptyV2,
} from './types'

const ajv = new Ajv({ allowUnionTypes: true })
const validateValidDashboardChartQuery = ajv.compile(validDashboardChartQuery)
const validateValidDashboardQuery = ajv.compile(validDashboardQuery)
const validateValidDashboardTableQuery = ajv.compile(validDashboardTableQuery)
const validatePlatformQuerySchema = ajv.compile(platformQuerySchema)
const validateDashboardConfigSchema = ajv.compile(dashboardConfigSchema)
const validateApiUsageQuerySchema = ajv.compile(apiUsageQuerySchema)
const validateBasicQuerySchema = ajv.compile(basicQuerySchema)
const validateLlmUsageQuerySchema = ajv.compile(llmUsageSchema)
const validateAgenticUsageQuerySchema = ajv.compile(agenticUsageSchema)

describe('dashboardSchema.v2', () => {
  const sharedPresetFilterableDimensions = [
    ...new Set([
      ...filterableExploreDimensions,
      ...filterableBasicExploreDimensions,
      ...filterableAiExploreDimensions,
      ...filterableAgenticExploreDimensions,
    ]),
  ]

  const presetFilterableDimensions = [
    ...new Set([
      ...sharedPresetFilterableDimensions,
      ...filterablePlatformPresetFilterDimensions,
    ]),
  ]

  const platformChartQuery = {
    datasource: 'platform',
    metrics: ['custom_metric_name'],
    dimensions: ['custom_dimension_name'],
    filters: [
      {
        operator: 'custom_platform_operator',
        field: 'custom_filter_field',
        value: ['custom_value'],
      },
    ],
  }

  const dashboardConfig = {
    tiles: [
      {
        type: 'chart',
        definition: {
          query: {
            ...platformChartQuery,
          },
          chart: {
            type: 'horizontal_bar',
          },
        },
        layout: {
          position: {
            col: 1,
            row: 1,
          },
          size: {
            cols: 1,
            rows: 1,
          },
        },
      },
    ],
    preset_filters: [
      {
        operator: 'in',
        field: 'gateway_service',
        value: ['example-service'],
      },
    ],
  }

  const mixedDashboardConfig = {
    ...dashboardConfig,
    tiles: [
      dashboardConfig.tiles[0],
      {
        type: 'chart',
        definition: {
          query: {
            datasource: 'api_usage',
            metrics: ['request_count'],
            dimensions: ['gateway_service'],
            filters: [
              {
                operator: 'in',
                field: 'gateway_service',
                value: ['example-service'],
              },
            ],
          },
          chart: {
            type: 'horizontal_bar',
          },
        },
        layout: {
          position: {
            col: 2,
            row: 1,
          },
          size: {
            cols: 1,
            rows: 1,
          },
        },
      },
    ],
  }

  const strictQuery = {
    datasource: 'api_usage',
    metrics: ['request_count'],
    dimensions: ['gateway_service'],
    filters: [
      {
        operator: 'in',
        field: 'gateway_service',
        value: ['example-service'],
      },
    ],
  }

  const tableChartTile = {
    type: 'chart',
    id: 'routes-table',
    definition: {
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: ['name', 'control_plane', 'gateway_service', 'env', 'team', 'region'],
        filters: [
          {
            field: 'control_plane',
            operator: 'in',
            value: ['16add929-6b9f-4e65-9285-7dfb6f0153d2'],
          },
          {
            field: 'env',
            operator: 'in',
            value: ['prod'],
          },
        ],
        cursor: 'eyJh',
        page_size: 50,
      },
      chart: {
        type: 'table',
        title: 'Routes',
      },
    },
    layout: {
      position: {
        col: 1,
        row: 1,
      },
      size: {
        cols: 2,
        rows: 2,
      },
    },
  }

  it('accepts platform queries with arbitrary strings at runtime', () => {
    expect(validatePlatformQuerySchema(platformChartQuery)).toBe(true)
    expect(validateValidDashboardQuery(platformChartQuery)).toBe(true)
    expect(validateDashboardConfigSchema(dashboardConfig)).toBe(true)
    expect(validateDashboardConfigSchema(mixedDashboardConfig)).toBe(true)
  })

  it('accepts table chart tiles with tabular explore query shape', () => {
    expect(validateValidDashboardQuery(tableChartTile.definition.query)).toBe(true)
    expect(validateValidDashboardTableQuery(tableChartTile.definition.query)).toBe(true)
    expect(validateValidDashboardChartQuery(tableChartTile.definition.query)).toBe(false)
    expect(validateDashboardConfigSchema({
      tiles: [
        tableChartTile,
      ],
    })).toBe(true)
  })

  it('rejects non-table chart tiles with tabular explore query shape', () => {
    expect(validateValidDashboardTableQuery(platformChartQuery)).toBe(false)

    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          type: 'chart',
          definition: {
            query: tableChartTile.definition.query,
            chart: {
              type: 'horizontal_bar',
            },
          },
        },
      ],
    })).toBe(false)
  })

  it('rejects table chart tiles with chart query shape', () => {
    expect(validateValidDashboardChartQuery(platformChartQuery)).toBe(true)
    expect(validateValidDashboardTableQuery(platformChartQuery)).toBe(false)

    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          definition: {
            query: platformChartQuery,
            chart: {
              type: 'table',
              title: 'Routes',
            },
          },
        },
      ],
    })).toBe(false)
  })

  it('rejects the old top-level table tile encoding', () => {
    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          type: 'table',
          definition: {
            query: tableChartTile.definition.query,
            config: {
              title: 'Routes',
            },
          },
        },
      ],
    })).toBe(false)
  })

  it('accepts table chart tiles with only the platform datasource', () => {
    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          definition: {
            query: {
              datasource: 'platform',
            },
            chart: {
              type: 'table',
            },
          },
        },
      ],
    })).toBe(true)
  })

  it('rejects table chart fields other than title', () => {
    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          definition: {
            ...tableChartTile.definition,
            chart: {
              type: 'table',
              title: 'Routes',
              description: 'Extra table chart field is not supported',
            },
          },
        },
      ],
    })).toBe(false)
  })

  it('rejects table chart tiles with a top-level query', () => {
    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          query: {
            entity: 'route',
            columns: ['name', 'control_plane'],
            page_size: 50,
          },
        },
      ],
    })).toBe(false)
  })

  it.each([
    ['invalid entity', { entity: 1 }],
    ['missing datasource', { datasource: undefined }],
    ['invalid datasource', { datasource: 'api_usage' }],
    ['empty columns', { columns: [] }],
    ['invalid columns', { columns: ['name', 1] }],
    ['invalid page size', { page_size: '50' }],
    ['invalid cursor', { cursor: 50 }],
    ['invalid filter', { filters: [{ field: 'env', value: ['prod'] }] }],
  ])('rejects table chart tiles with %s', (_description, queryOverrides) => {
    expect(validateValidDashboardTableQuery({
      ...tableChartTile.definition.query,
      ...queryOverrides,
    })).toBe(false)

    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          definition: {
            chart: tableChartTile.definition.chart,
            query: {
              ...tableChartTile.definition.query,
              ...queryOverrides,
            },
          },
        },
      ],
    })).toBe(false)
  })

  it('rejects table tile definitions without chart definitions', () => {
    expect(validateDashboardConfigSchema({
      tiles: [
        {
          ...tableChartTile,
          definition: {
            query: tableChartTile.definition.query,
          },
        },
      ],
    })).toBe(false)
  })

  it('accepts top_n entity link mappings', () => {
    const topNEntityLinksConfig = {
      ...dashboardConfig,
      tiles: [
        {
          ...dashboardConfig.tiles[0],
          definition: {
            query: strictQuery,
            chart: {
              type: 'top_n',
              entity_link: 'https://example.com/routes/{entity-id}',
              entity_links: {
                route: 'https://example.com/routes/{entity-id}',
                gateway_service: 'https://example.com/services/{entity-id}',
              },
            },
          },
        },
      ],
    }

    expect(validateDashboardConfigSchema(topNEntityLinksConfig)).toBe(true)
  })

  it('accepts dashboard queries with three dimensions', () => {
    const topNThreeDimensionConfig = {
      ...dashboardConfig,
      tiles: [
        {
          ...dashboardConfig.tiles[0],
          definition: {
            query: {
              ...strictQuery,
              dimensions: ['route', 'gateway_service', 'consumer'],
            },
            chart: {
              type: 'top_n',
            },
          },
        },
      ],
    }

    expect(validateValidDashboardQuery(topNThreeDimensionConfig.tiles[0].definition.query)).toBe(true)
    expect(validateDashboardConfigSchema(topNThreeDimensionConfig)).toBe(true)
  })

  it('rejects top_n entity link mappings with non-string values', () => {
    const topNEntityLinksConfig = {
      ...dashboardConfig,
      tiles: [
        {
          ...dashboardConfig.tiles[0],
          definition: {
            query: strictQuery,
            chart: {
              type: 'top_n',
              entity_links: {
                route: 1,
              },
            },
          },
        },
      ],
    }

    expect(validateDashboardConfigSchema(topNEntityLinksConfig)).toBe(false)
  })

  it.each([
    [apiUsageQuerySchema, exploreAggregations, queryableExploreDimensions, filterableExploreDimensions],
    [basicQuerySchema, basicExploreAggregations, queryableBasicExploreDimensions, filterableBasicExploreDimensions],
    [llmUsageSchema, aiExploreAggregations, queryableAiExploreDimensions, filterableAiExploreDimensions],
    [agenticUsageSchema, agenticExploreAggregations, queryableAgenticExploreDimensions, filterableAgenticExploreDimensions],
  ])('keeps strict enums for existing datasource schemas', (schema, expectedMetrics, expectedDimensions, expectedFilterableDimensions) => {
    expect(schema.properties.datasource.enum).toHaveLength(1)
    expect(schema.properties.metrics.items.enum).toEqual(expectedMetrics)
    expect(schema.properties.dimensions.items.enum).toEqual(expectedDimensions)
    expect(schema.properties.filters.items.oneOf[0].properties.field.enum).toEqual(expectedFilterableDimensions)
    expect(schema.properties.filters.items.oneOf[1].properties.field.enum).toEqual(expectedFilterableDimensions)
  })

  it('loosens only the platform branch', () => {
    expect(platformQuerySchema.properties.datasource.enum).toEqual(['platform'])
    expect(platformQuerySchema.properties.metrics.items.enum).toBeUndefined()
    expect(platformQuerySchema.properties.dimensions.items.enum).toBeUndefined()
    expect(platformQuerySchema.properties.filters.items.oneOf[0].properties.field.enum).toBeUndefined()
    expect(platformQuerySchema.properties.filters.items.oneOf[1].properties.field.enum).toBeUndefined()
    expect(platformQuerySchema.properties.filters.items.oneOf[0].properties.operator.enum).toBeUndefined()
    expect(platformQuerySchema.properties.filters.items.oneOf[1].properties.operator.enum).toBeUndefined()
  })

  it('includes platform fields in the strict preset filter enum and preserves operator enums', () => {
    // oneOf[0] is the value-bearing filter shape: { field, operator, value }.
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[0].properties.field.enum).toEqual(presetFilterableDimensions)
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[0].properties.operator.enum).toEqual(exploreFilterTypesV2)

    // oneOf[1] is the no-value filter shape: { field, operator }.
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[1].properties.field.enum).toEqual(presetFilterableDimensions)
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[1].properties.operator.enum).toEqual(requestFilterTypeEmptyV2)
    expect(barChartSchema.properties.type.enum).toEqual(['horizontal_bar', 'vertical_bar'])
  })

  it('rejects arbitrary strings for strict schemas', () => {
    const invalidStrictQuery = {
      ...strictQuery,
      metrics: ['custom_metric_name'],
      dimensions: ['custom_dimension_name'],
      filters: [
        {
          operator: 'in',
          field: 'custom_filter_field',
          value: ['custom_value'],
        },
      ],
    }

    expect(validateApiUsageQuerySchema(invalidStrictQuery)).toBe(false)
    expect(validateBasicQuerySchema({
      ...invalidStrictQuery,
      datasource: 'basic',
    })).toBe(false)
    expect(validateLlmUsageQuerySchema({
      ...invalidStrictQuery,
      datasource: 'llm_usage',
    })).toBe(false)
    expect(validateAgenticUsageQuerySchema({
      ...invalidStrictQuery,
      datasource: 'agentic_usage',
    })).toBe(false)
  })
})

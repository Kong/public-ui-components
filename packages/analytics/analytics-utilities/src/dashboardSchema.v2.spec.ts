import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import {
  apiUsageQuerySchema,
  barChartSchema,
  basicQuerySchema,
  dashboardConfigSchema,
  llmUsageSchema,
  mcpUsageSchema,
  validDashboardQuery,
  platformQuerySchema,
} from './dashboardSchema.v2'
import {
  aiExploreAggregations,
  basicExploreAggregations,
  exploreAggregations,
  exploreFilterTypesV2,
  filterableAiExploreDimensions,
  filterableBasicExploreDimensions,
  filterableExploreDimensions,
  filterableMcpExploreDimensions,
  mcpExploreAggregations,
  queryableAiExploreDimensions,
  queryableBasicExploreDimensions,
  queryableExploreDimensions,
  queryableMcpExploreDimensions,
  requestFilterTypeEmptyV2,
} from './types'

const ajv = new Ajv({ allowUnionTypes: true })
const validateValidDashboardQuery = ajv.compile(validDashboardQuery)
const validatePlatformQuerySchema = ajv.compile(platformQuerySchema)
const validateDashboardConfigSchema = ajv.compile(dashboardConfigSchema)
const validateApiUsageQuerySchema = ajv.compile(apiUsageQuerySchema)
const validateBasicQuerySchema = ajv.compile(basicQuerySchema)
const validateLlmUsageQuerySchema = ajv.compile(llmUsageSchema)
const validateMcpUsageQuerySchema = ajv.compile(mcpUsageSchema)

describe('dashboardSchema.v2', () => {
  const sharedPresetFilterableDimensions = [
    ...new Set([
      ...filterableExploreDimensions,
      ...filterableBasicExploreDimensions,
      ...filterableAiExploreDimensions,
      ...filterableMcpExploreDimensions,
    ]),
  ]

  const platformQuery = {
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
            ...platformQuery,
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

  it('accepts platform queries with arbitrary strings at runtime', () => {
    expect(validatePlatformQuerySchema(platformQuery)).toBe(true)
    expect(validateValidDashboardQuery(platformQuery)).toBe(true)
    expect(validateDashboardConfigSchema(dashboardConfig)).toBe(true)
    expect(validateDashboardConfigSchema(mixedDashboardConfig)).toBe(true)
  })

  it.each([
    [apiUsageQuerySchema, exploreAggregations, queryableExploreDimensions, filterableExploreDimensions],
    [basicQuerySchema, basicExploreAggregations, queryableBasicExploreDimensions, filterableBasicExploreDimensions],
    [llmUsageSchema, aiExploreAggregations, queryableAiExploreDimensions, filterableAiExploreDimensions],
    [mcpUsageSchema, mcpExploreAggregations, queryableMcpExploreDimensions, filterableMcpExploreDimensions],
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

  it('keeps shared preset filters strict and operator enums intact', () => {
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[0].properties.field.enum).toEqual(sharedPresetFilterableDimensions)
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[1].properties.field.enum).toEqual(sharedPresetFilterableDimensions)
    expect(dashboardConfigSchema.properties.preset_filters.items.oneOf[0].properties.operator.enum).toEqual(exploreFilterTypesV2)
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
    expect(validateMcpUsageQuerySchema({
      ...invalidStrictQuery,
      datasource: 'agentic_usage',
    })).toBe(false)
  })
})

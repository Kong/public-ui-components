import type { Component, Plugin } from 'vue'
import { nonTsExploreResponse, routeExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src'
import { generateCrossSectionalData, generateData, generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import type {
  AnalyticsBridge,
  AnalyticsConfigV2,
  DatasourceAwareQuery,
  DatasourceAwareTabularQuery,
  ExploreResultV4,
  PlatformTabularRecord,
  PlatformTabularQuery,
  PlatformTabularResponse,
} from '@kong-ui-public/analytics-utilities'
import { EntityLink } from '@kong-ui-public/entities-shared'

const singleValueTrendExploreResponse: ExploreResultV4 = {
  data: [
    {
      event: { request_count: 7_812 },
      timestamp: '2024-01-31T18:00:00.000Z',
    },
    {
      event: { request_count: 8_412 },
      timestamp: '2024-01-31T19:00:00.000Z',
    },
  ],
  meta: {
    display: {},
    end: '2024-01-31T20:00:00.000Z',
    granularity_ms: 60 * 60 * 1000,
    metric_names: ['request_count'],
    metric_units: { request_count: 'count' },
    query_id: 'single-value-trend',
    start: '2024-01-31T18:00:00.000Z',
    truncated: false,
  },
}

const aiProviderExploreResponse: ExploreResultV4 = {
  data: [
    ['openai', 1_408, 35.2, 13.5, 23_100],
    ['anthropic', 1_363, 16.36, 14.5, 5_000],
    ['azure', 859, 20.62, 17.1, 45_500],
    ['bedrock', 659, 3.3, 13.8, 7_700],
    ['deepseek', 420, 2.1, 0.42, 3_300],
    ['gemini', 503, 0.1, 0.05, 10_000],
    ['ollama', 734, 4.5, 3.4, 4_200],
    ['mistral', 212, 0.42, 4.2, 2_100],
    ['moonshot', 30, 0.001, 0.00004, 2_400],
  ].map(([aiProvider, requests, cost, errorRate, ttft]) => ({
    event: {
      ai_provider: aiProvider,
      ai_request_count: requests,
      cost,
      error_rate: errorRate,
      time_to_first_token_p95: ttft,
    },
    timestamp: '2024-01-31T20:00:00.000Z',
  })),
  meta: {
    display: {
      ai_provider: {
        openai: { name: 'OpenAI', deleted: false },
        anthropic: { name: 'Anthropic', deleted: false },
        azure: { name: 'Azure OpenAI', deleted: false },
        bedrock: { name: 'AWS Bedrock', deleted: false },
        deepseek: { name: 'DeepSeek', deleted: false },
        gemini: { name: 'Gemini', deleted: false },
        ollama: { name: 'Ollama', deleted: false },
        mistral: { name: 'Mistral', deleted: false },
        moonshot: { name: 'Moonshot', deleted: false },
      },
    },
    end: '2024-01-31T20:00:00.000Z',
    granularity_ms: 60 * 60 * 1000,
    metric_names: ['cost', 'ai_request_count', 'error_rate', 'time_to_first_token_p95'],
    metric_units: {
      cost: 'usd',
      ai_request_count: 'count',
      error_rate: '%',
      time_to_first_token_p95: 'ms',
    },
    query_id: 'ai-provider-top-n',
    start: '2024-01-31T19:00:00.000Z',
    truncated: false,
  },
}

const delayedResponse = <T>(response: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

const queryFn = async (query: DatasourceAwareQuery): Promise<ExploreResultV4> => {
  console.log('Querying data:', query)
  if (
    query.query.granularity === 'trend'
    && query.query.dimensions?.length === 1
    && query.query.dimensions[0] === 'time'
    && query.query.metrics?.length === 1
    && query.query.metrics[0] === 'request_count'
  ) {
    return await delayedResponse(singleValueTrendExploreResponse)
  }

  // Complete TopN result: deliberately larger than the infinite grid block size.
  if (query.query.dimensions?.some(dimension => dimension === 'gateway_service') && query.query.dimensions.some(dimension => dimension === 'status_code')) {
    const data = Array.from({ length: 40 }, (_, index) => ({
      timestamp: '2026-09-21T00:00:00Z',
      event: { gateway_service: `service-${index + 1}`, status_code: index % 5 === 0 ? '500' : '200', request_count: (40 - index) * 100, response_latency_p95: (index + 1) * 10 },
    }))
    return await delayedResponse({
      data,
      meta: {
        start: '2026-09-20T00:00:00Z', end: '2026-09-21T00:00:00Z', granularity_ms: 0,
        query_id: 'topn-complete-result', truncated: false,
        display: {
          gateway_service: Object.fromEntries(data.map(({ event }) => [event.gateway_service, { name: `Gateway service ${event.gateway_service.split('-')[1]}` }])),
          status_code: { 200: { name: '200' }, 500: { name: '500' } },
        },
        metric_names: ['request_count', 'response_latency_p95'],
        metric_units: { request_count: 'count', response_latency_p95: 'ms' },
      },
    })
  }

  if (query.query.dimensions && query.query.dimensions.includes('time')) {
    if (query.query.metrics?.includes('response_latency_average') && query.query.metrics.includes('response_latency_p99')) {
      return await delayedResponse(generateData({
        metrics: [
          { name: 'response_latency_average', unit: 'ms' },
          { name: 'response_latency_p99', unit: 'ms' },
        ],
        dimensionMap: { status_code: ['200', '400', '500'] },
        timeSeries: true,
      }))
    }

    return await delayedResponse(
      generateSingleMetricTimeSeriesData(
        { name: 'request_count', unit: 'count' },
        { status_code: ['200', '400', '500'] },
      ),
    )
  }

  if (query.query.dimensions && query.query.dimensions.includes('country_code')) {
    return await delayedResponse(
      generateCrossSectionalData(
        [{ name: 'request_count', unit: 'count' }],
        { country_code: ['US', 'GB', 'FR', 'DE', 'RO', 'CN', 'IN', 'BR', 'ZA'] },
      ),
    )
  }

  if (query.query.dimensions?.includes('ai_provider')) {
    return await delayedResponse(aiProviderExploreResponse)
  }

  if (query.query.dimensions && query.query.dimensions.findIndex(d => d === 'route') > -1) {
    return await delayedResponse(routeExploreResponse)
  }

  if (query.query.dimensions && query.query.dimensions.findIndex(d => d === 'portal') > -1) {
    const err: any = new Error('ERROR_ANALYTICS_FORBIDDEN')
    err.status = 403
    err.response = { message: 'Forbidden' }

    throw err
  }

  if (query.query.limit) {
    return {
      ...nonTsExploreResponse,
      data: nonTsExploreResponse.data.slice(0, query.query.limit),
    }
  }

  return await delayedResponse(nonTsExploreResponse)
}

const sandboxTabularColumns = ['name', 'control_plane', 'gateway_service', 'env', 'team', 'region']
const sandboxTabularPageSize = 25

const sandboxTabularRecordFixtures = [
  {
    name: 'Orders read route',
    control_plane: 'cp-prod-usw2',
    gateway_service: 'svc-orders',
    env: 'prod',
    team: 'checkout',
    region: 'us-west-2',
  },
  {
    name: 'Orders write route',
    control_plane: 'cp-prod-usw2',
    gateway_service: 'svc-orders',
    env: 'prod',
    team: 'checkout',
    region: 'us-west-2',
  },
  {
    name: 'Identity introspection route',
    control_plane: 'cp-prod-use1',
    gateway_service: 'svc-identity',
    env: 'prod',
    team: 'identity',
    region: 'us-east-1',
  },
  {
    name: 'Billing webhooks route',
    control_plane: 'cp-prod-euw1',
    gateway_service: 'svc-billing',
    env: 'prod',
    team: 'billing',
    region: 'eu-west-1',
  },
  {
    name: 'Inventory lookup route',
    control_plane: 'cp-staging-usw2',
    gateway_service: 'svc-inventory',
    env: 'staging',
    team: 'catalog',
    region: 'us-west-2',
  },
  {
    name: 'Support portal route',
    control_plane: 'cp-staging-usw2',
    gateway_service: 'svc-support',
    env: 'staging',
    team: 'support',
    region: 'us-west-2',
  },
] satisfies PlatformTabularRecord[]

const sandboxTabularRecords = Array.from({ length: 75 }, (_, index): PlatformTabularRecord => {
  const fixture = sandboxTabularRecordFixtures[index % sandboxTabularRecordFixtures.length]

  return {
    ...fixture,
    name: `${fixture.name} ${index + 1}`,
  }
})

const sandboxTabularDisplay: PlatformTabularResponse['meta']['display'] = {
  control_plane: {
    'cp-prod-usw2': {
      name: 'Production US West',
    },
    'cp-prod-use1': {
      name: 'Production US East',
    },
    'cp-prod-euw1': {
      name: 'Production EU West',
    },
    'cp-staging-usw2': {
      name: 'Staging US West',
    },
  },
  gateway_service: {
    'svc-orders': {
      name: 'Orders API',
    },
    'svc-identity': {
      name: 'Identity API',
    },
    'svc-billing': {
      name: 'Billing API',
    },
    'svc-inventory': {
      name: 'Inventory API',
    },
    'svc-support': {
      name: 'Support Portal API',
    },
  },
}

const projectColumns = (
  records: PlatformTabularRecord[],
  columns: string[],
): PlatformTabularRecord[] => records.map(record => columns.reduce<PlatformTabularRecord>(
  (projectedRecord, column) => {
    projectedRecord[column] = record[column] ?? null

    return projectedRecord
  },
  {},
))

const matchesTabularFilters = (
  record: PlatformTabularRecord,
  query: PlatformTabularQuery,
): boolean => (query.filters ?? []).every(filter => {
  if (filter.operator !== 'in' || !('value' in filter)) {
    return true
  }

  const recordValue = record[filter.field]

  if (typeof recordValue === 'boolean') {
    return false
  }

  return filter.value.includes(recordValue)
})

const getTabularColumns = (query: PlatformTabularQuery): string[] => (
  query.columns?.length ? query.columns : sandboxTabularColumns
)

const getTabularPageSize = (query: PlatformTabularQuery): number => (
  query.page_size ?? sandboxTabularPageSize
)

const getTabularStartIndex = ({
  cursor,
}: {
  cursor: PlatformTabularQuery['cursor']
}): number => {
  if (!cursor) {
    return 0
  }

  const [, startIndex] = cursor.split(':')

  return Number(startIndex) || 0
}

const getNextTabularCursor = ({
  recordsLength,
  startIndex,
  totalRecords,
}: {
  recordsLength: number
  startIndex: number
  totalRecords: number
}): string | undefined => (
  startIndex + recordsLength < totalRecords ? `sandbox-routes:${startIndex + recordsLength}` : undefined
)

const tabularQueryFn = async (datasourceAwareQuery: DatasourceAwareTabularQuery): Promise<PlatformTabularResponse> => {
  console.log('Querying tabular data:', datasourceAwareQuery)

  const query = datasourceAwareQuery.query
  const columns = getTabularColumns(query)
  const pageSize = getTabularPageSize(query)
  const filteredRecords = sandboxTabularRecords.filter(record => matchesTabularFilters(record, query))
  const startIndex = getTabularStartIndex({
    cursor: query.cursor,
  })
  const records = projectColumns(
    filteredRecords.slice(startIndex, startIndex + pageSize),
    columns,
  )
  const nextCursor = getNextTabularCursor({
    recordsLength: records.length,
    startIndex,
    totalRecords: filteredRecords.length,
  })

  return await delayedResponse({
    records,
    meta: {
      columns,
      cursor: nextCursor,
      datasource: 'platform',
      display: sandboxTabularDisplay,
      entity: query.entity,
      page_size: pageSize,
      query_id: 'sandbox-tabular-routes',
    },
  })
}

const configFn = (): Promise<AnalyticsConfigV2> => {
  return new Promise(resolve => {
    window.setTimeout(() => {
      console.log('Analytics config resolved')
      resolve({
        analytics: {
          percentiles: true,
          retention_ms: 2592000000, // 30d
        },
        requests: {
          retention_ms: 86400000,
        },
      })
    }, 1000)
  })
}

const evaluateFeatureFlagFn = () => true

const datasourceConfigFn = () => Promise.resolve([])

const exploreBaseUrl = async () => 'https://cloud.konghq.tech/us/analytics/explorer'

const requestsBaseUrl = async () => 'https://cloud.konghq.tech/us/analytics/api-requests'

const fetchComponent = async (): Promise<Component> => {
  return Promise.resolve(EntityLink)
}

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, { queryFn, tabularQueryFn, configFn, datasourceConfigFn, evaluateFeatureFlagFn, exploreBaseUrl, requestsBaseUrl, fetchComponent } as AnalyticsBridge)
  },
}

export default sandboxQueryProvider

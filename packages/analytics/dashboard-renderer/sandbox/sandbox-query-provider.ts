import type { Component, Plugin } from 'vue'
import { nonTsExploreResponse, routeExploreResponse } from './mock-data'
import { INJECT_QUERY_PROVIDER } from '../src'
import { generateCrossSectionalData, generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
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

const delayedResponse = <T>(response: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(response)
    }, 1000)
  })
}

const queryFn = async (query: DatasourceAwareQuery): Promise<ExploreResultV4> => {
  console.log('Querying data:', query)
  if (query.query.dimensions && query.query.dimensions.includes('time')) {
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

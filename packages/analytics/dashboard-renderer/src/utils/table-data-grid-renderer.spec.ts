import { describe, expect, it, vi } from 'vitest'
import type { DashboardRendererContextInternal } from '../types'
import type { PlatformDatasourceTabularQuery, PlatformTabularResponse } from '@kong-ui-public/analytics-utilities'
import {
  tableDataGridFetcherByDatasource,
  tableDataGridHeadersByDatasource,
} from './table-data-grid-renderer'

const context: DashboardRendererContextInternal = {
  filters: [
    {
      field: 'gateway_service',
      operator: 'in',
      value: ['service-1'],
    },
  ],
  timeSpec: {
    type: 'relative',
    time_range: '15m',
  },
  editable: false,
  refreshInterval: 0,
  showTileActions: true,
  showTileZoomActions: false,
  tz: 'Etc/UTC',
  zoomable: false,
}

const response: PlatformTabularResponse = {
  records: [
    {
      control_plane: 'cp-id',
      gateway_service: 'service-id',
      status_code: 200,
      request_count: null,
    },
  ],
  meta: {
    columns: ['control_plane', 'gateway_service', 'status_code', 'request_count'],
    cursor: 'next-page',
    datasource: 'platform',
    display: {
      control_plane: {
        'cp-id': {
          name: 'Control Plane One',
        },
      },
      gateway_service: {},
    },
    entity: 'route',
    page_size: 50,
    query_id: 'query-1',
  },
}

describe('table data grid renderer utilities', () => {
  it('builds translated headers from query columns and falls back to raw labels', () => {
    const translate = (key: string): string => ({
      'chartLabels.control_plane': 'Control plane',
      'chartLabels.gateway_service': 'Gateway service',
    })[key] ?? key

    const canTranslate = (key: string): boolean => key !== 'chartLabels.unknown_column'

    const expected = [
      { key: 'control_plane', label: 'Control plane' },
      { key: 'gateway_service', label: 'Gateway service' },
      { key: 'unknown_column', label: 'unknown_column' },
    ]
    const args = { columns: ['control_plane', 'gateway_service', 'unknown_column'], translate, canTranslate }

    expect(tableDataGridHeadersByDatasource.platform(args)).toEqual(expected)
    expect(tableDataGridHeadersByDatasource.platform_usage(args)).toEqual(expected)
  })

  it('selects the platform fetcher and fetches tabular data with a datasource-aware query', async () => {
    const tabularQueryFn = vi.fn().mockResolvedValue(response)
    const abortController = new AbortController()
    const query: PlatformDatasourceTabularQuery = {
      datasource: 'platform',
      query: {
        entity: 'route',
        columns: ['control_plane', 'gateway_service'],
        cursor: 'initial-cursor',
        filters: [
          {
            field: 'route',
            operator: 'in',
            value: ['route-id'],
          },
        ],
        page_size: 100,
      },
    }
    const onResponseColumns = vi.fn()
    const stripUnknownFilters = vi.fn(({ filters }) => filters)

    await expect(tableDataGridFetcherByDatasource[query.datasource]({
      abortController,
      context,
      cursor: 'request-cursor',
      onResponseColumns,
      pageSize: 50,
      query,
      stripUnknownFilters,
      tabularQueryFn,
    })).resolves.toEqual({
      data: [
        {
          control_plane: 'Control Plane One',
          gateway_service: 'service-id',
          status_code: 200,
          request_count: null,
        },
      ],
      cursor: 'next-page',
      hasMore: true,
    })
    expect(response.records[0].control_plane).toBe('cp-id')

    expect(stripUnknownFilters).toHaveBeenCalledWith({
      datasource: 'platform',
      filters: [
        {
          field: 'route',
          operator: 'in',
          value: ['route-id'],
        },
        {
          field: 'gateway_service',
          operator: 'in',
          value: ['service-1'],
        },
      ],
      queryFields: ['route'],
    })
    expect(tabularQueryFn).toHaveBeenCalledWith({
      datasource: 'platform',
      query: {
        entity: 'route',
        columns: ['control_plane', 'gateway_service'],
        cursor: 'request-cursor',
        filters: [
          {
            field: 'route',
            operator: 'in',
            value: ['route-id'],
          },
          {
            field: 'gateway_service',
            operator: 'in',
            value: ['service-1'],
          },
        ],
        page_size: 50,
      },
    }, abortController)
    expect(onResponseColumns).toHaveBeenCalledWith(['control_plane', 'gateway_service', 'status_code', 'request_count'])
  })

  it('uses the initial query cursor when the table request has no cursor', async () => {
    const tabularQueryFn = vi.fn().mockResolvedValue({
      ...response,
      meta: {
        ...response.meta,
        cursor: undefined,
      },
    } satisfies PlatformTabularResponse)
    const query: PlatformDatasourceTabularQuery = {
      datasource: 'platform',
      query: {
        cursor: 'initial-cursor',
      },
    }
    await expect(tableDataGridFetcherByDatasource[query.datasource]({
      abortController: new AbortController(),
      context,
      pageSize: 25,
      query,
      stripUnknownFilters: ({ filters }) => filters,
      tabularQueryFn,
    })).resolves.toMatchObject({
      cursor: undefined,
      hasMore: false,
    })

    expect(tabularQueryFn).toHaveBeenCalledWith(expect.objectContaining({
      datasource: 'platform',
      query: expect.objectContaining({
        cursor: 'initial-cursor',
        page_size: 25,
      }),
    }), expect.any(AbortController))
  })

  it('throws a clear error when the tabular bridge function is unavailable', async () => {
    const query: PlatformDatasourceTabularQuery = {
      datasource: 'platform',
      query: {},
    }

    await expect(tableDataGridFetcherByDatasource[query.datasource]({
      abortController: new AbortController(),
      context,
      pageSize: 25,
      query,
      stripUnknownFilters: ({ filters }) => filters,
      tabularQueryFn: undefined,
    })).rejects.toThrow('AnalyticsBridge.tabularQueryFn is not defined')
  })

  it('platform_usage fetcher resolves using the same implementation as platform', async () => {
    const tabularQueryFn = vi.fn().mockResolvedValue(response)
    const query: PlatformDatasourceTabularQuery = {
      datasource: 'platform_usage',
      query: { entity: 'route', columns: ['control_plane'], page_size: 10 },
    }

    await expect(tableDataGridFetcherByDatasource.platform_usage({
      abortController: new AbortController(),
      context,
      pageSize: 10,
      query,
      stripUnknownFilters: ({ filters }) => filters,
      tabularQueryFn,
    })).resolves.toMatchObject({ hasMore: true, cursor: 'next-page' })

    expect(tabularQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ datasource: 'platform_usage' }),
      expect.any(AbortController),
    )
  })
})

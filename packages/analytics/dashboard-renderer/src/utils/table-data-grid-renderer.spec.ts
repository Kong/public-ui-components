import { describe, expect, it, vi } from 'vitest'
import type { DashboardRendererContextInternal } from '../types'
import type { DatasourceAwareTabularQuery, PlatformTabularResponse } from '@kong-ui-public/analytics-utilities'
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

    expect(tableDataGridHeadersByDatasource.platform({
      columns: ['control_plane', 'gateway_service', 'unknown_column'],
      translate,
      canTranslate,
    })).toEqual([
      { key: 'control_plane', label: 'Control plane' },
      { key: 'gateway_service', label: 'Gateway service' },
      { key: 'unknown_column', label: 'unknown_column' },
    ])
  })

  it('selects the platform fetcher and fetches tabular data with a datasource-aware query', async () => {
    const tabularQueryFn = vi.fn().mockResolvedValue(response)
    const abortController = new AbortController()
    const query: DatasourceAwareTabularQuery = {
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
    const stripUnknownFilters = vi.fn(({ filters }) => filters)
    const onResponseColumns = vi.fn()
    const fetcher = tableDataGridFetcherByDatasource[query.datasource]({
      abortController,
      context,
      onResponseColumns,
      query,
      stripUnknownFilters,
      tabularQueryFn,
    })

    await expect(fetcher({
      mode: 'infinite',
      pageSize: 50,
      cursor: 'request-cursor',
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
    const query: DatasourceAwareTabularQuery = {
      datasource: 'platform',
      query: {
        cursor: 'initial-cursor',
      },
    }
    const fetcher = tableDataGridFetcherByDatasource[query.datasource]({
      abortController: new AbortController(),
      context,
      query,
      stripUnknownFilters: ({ filters }) => filters,
      tabularQueryFn,
    })

    await expect(fetcher({
      mode: 'infinite',
      pageSize: 25,
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
    const query: DatasourceAwareTabularQuery = {
      datasource: 'platform',
      query: {},
    }
    const fetcher = tableDataGridFetcherByDatasource[query.datasource]({
      abortController: new AbortController(),
      context,
      query,
      stripUnknownFilters: ({ filters }) => filters,
      tabularQueryFn: undefined,
    })

    await expect(fetcher({
      mode: 'infinite',
      pageSize: 25,
    })).rejects.toThrow('AnalyticsBridge.tabularQueryFn is not defined')
  })
})

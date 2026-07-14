import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import TableDataGridRenderer from './TableDataGridRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContextInternal } from '../types'
import type {
  AnalyticsBridge,
  PlatformTabularResponse,
  ValidDashboardTableQuery,
} from '@kong-ui-public/analytics-utilities'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import type { TableDataGridFetcher } from '@kong-ui-public/table-data-grid'

const tableDataGridProps = vi.hoisted(() => vi.fn())
const isReady = vi.hoisted(() => vi.fn())

vi.mock('@kong-ui-public/table-data-grid', () => ({
  TableDataGrid: defineComponent({
    name: 'TableDataGrid',
    props: {
      error: {
        type: Boolean,
        default: false,
      },
      fetcher: {
        type: Function,
        required: true,
      },
      headers: {
        type: Array,
        required: true,
      },
      pageSize: {
        type: Number,
        default: undefined,
      },
      refreshKey: {
        type: [String, Number, Boolean],
        default: undefined,
      },
    },
    emits: ['state'],
    setup(props) {
      tableDataGridProps(props)

      return () => h('div', {
        'data-testid': 'table-data-grid-stub',
        'data-error': String(props.error),
      }, props.headers.map((header: any) => header.label).join(','))
    },
  }),
}))

vi.mock('@kong-ui-public/analytics-config-store', () => ({
  useDatasourceConfigStore: vi.fn(),
}))

const context: DashboardRendererContextInternal = {
  filters: [],
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

const query: ValidDashboardTableQuery = {
  datasource: 'platform',
  entity: 'route',
  columns: ['control_plane'],
  page_size: 50,
}

const response: PlatformTabularResponse = {
  records: [
    {
      control_plane: 'cp-id',
    },
  ],
  meta: {
    columns: ['control_plane'],
    datasource: 'platform',
    display: {
      control_plane: {
        'cp-id': {
          name: 'Control Plane One',
        },
      },
    },
    entity: 'route',
    page_size: 50,
    query_id: 'query-1',
  },
}

const mountRenderer = ({
  height = 320,
  omitHeight = false,
  queryOverride,
  queryBridge,
  queryReady = true,
}: {
  height?: number
  omitHeight?: boolean
  queryOverride?: ValidDashboardTableQuery
  queryBridge?: Partial<AnalyticsBridge>
  queryReady?: boolean
} = {}) => mount(TableDataGridRenderer, {
  props: {
    context,
    ...(omitHeight ? {} : { height }),
    query: queryOverride ?? query,
    queryReady,
    refreshCounter: 3,
  },
  global: {
    provide: {
      [INJECT_QUERY_PROVIDER]: queryBridge ?? {
        tabularQueryFn: vi.fn().mockResolvedValue(response),
      },
    },
    stubs: {
      KSkeleton: {
        template: '<div data-testid="table-skeleton" />',
      },
    },
  },
})

const mountRendererWithTabularSpy = async () => {
  const tabularQueryFn = vi.fn().mockResolvedValue(response)
  const wrapper = mountRenderer({
    queryBridge: {
      tabularQueryFn,
    },
  })
  await flushPromises()

  return {
    tabularQueryFn,
    wrapper,
  }
}

const getTableDataGridProps = (wrapper: ReturnType<typeof mountRenderer>) => wrapper.findComponent({ name: 'TableDataGrid' }).props()

const fetchFirstPage = async (wrapper: ReturnType<typeof mountRenderer>) => {
  const fetcher = getTableDataGridProps(wrapper).fetcher as TableDataGridFetcher

  await fetcher({
    mode: 'infinite',
    pageSize: 50,
  })
  await flushPromises()
}

const expectFirstPageTabularQuery = async ({
  expectedCallCount = 1,
  expectedQuery,
  initialRefreshKey,
  tabularQueryFn,
  wrapper,
}: {
  expectedCallCount?: number
  expectedQuery: Record<string, unknown>
  initialRefreshKey: unknown
  tabularQueryFn: ReturnType<typeof vi.fn>
  wrapper: ReturnType<typeof mountRenderer>
}) => {
  expect(getTableDataGridProps(wrapper).refreshKey).not.toBe(initialRefreshKey)

  await fetchFirstPage(wrapper)

  expect(tabularQueryFn).toHaveBeenCalledTimes(expectedCallCount)
  expect(tabularQueryFn).toHaveBeenNthCalledWith(expectedCallCount, {
    datasource: 'platform',
    query: expect.objectContaining({
      cursor: undefined,
      ...expectedQuery,
    }),
  }, expect.any(AbortController))
}

describe('TableDataGridRenderer', () => {
  beforeEach(() => {
    tableDataGridProps.mockClear()
    isReady.mockReset()
    isReady.mockResolvedValue(undefined)
    vi.mocked(useDatasourceConfigStore).mockReturnValue({
      isReady,
      stripUnknownFilters: ({ filters }: { filters: unknown[] }) => filters,
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a skeleton instead of the grid before queries are ready', () => {
    const wrapper = mountRenderer({
      queryReady: false,
    })

    expect(wrapper.findTestId('table-skeleton').exists()).toBe(true)
    expect(wrapper.findTestId('table-data-grid-stub').exists()).toBe(false)
  })

  it('applies the dashboard tile height to the table wrapper', () => {
    const wrapper = mountRenderer()

    expect(wrapper.get('.table-data-grid-renderer').attributes('style')).toContain('height: 320px')
  })

  it('uses parent-owned height when no explicit height is provided', () => {
    const wrapper = mountRenderer({
      omitHeight: true,
    })

    expect(wrapper.get('.table-data-grid-renderer').attributes('style')).toBeUndefined()
  })

  it('passes translated headers, page size, refresh key, and fetcher to TableDataGrid', async () => {
    const wrapper = mountRenderer()
    await flushPromises()

    expect(wrapper.getTestId('table-data-grid-stub').text()).toBe('Control plane')
    expect(tableDataGridProps).toHaveBeenCalledWith(expect.objectContaining({
      headers: [
        {
          key: 'control_plane',
          label: 'Control plane',
        },
      ],
      pageSize: 50,
      refreshKey: expect.stringContaining('"refreshCounter":3'),
    }))
    expect(tableDataGridProps.mock.calls[0][0].fetcher).toEqual(expect.any(Function))
  })

  it('updates the table refresh key when the table query entity changes', async () => {
    const { tabularQueryFn, wrapper } = await mountRendererWithTabularSpy()
    const initialRefreshKey = getTableDataGridProps(wrapper).refreshKey

    await wrapper.setProps({
      query: {
        ...query,
        entity: 'service',
      },
    })
    await flushPromises()

    await expectFirstPageTabularQuery({
      expectedQuery: {
        entity: 'service',
      },
      initialRefreshKey,
      tabularQueryFn,
      wrapper,
    })
  })

  it('includes updated columns in the refetched table query', async () => {
    const { tabularQueryFn, wrapper } = await mountRendererWithTabularSpy()
    const initialRefreshKey = getTableDataGridProps(wrapper).refreshKey

    await wrapper.setProps({
      query: {
        ...query,
        columns: ['name', 'control_plane'],
      },
    })
    await flushPromises()

    await expectFirstPageTabularQuery({
      expectedQuery: {
        columns: ['name', 'control_plane'],
      },
      initialRefreshKey,
      tabularQueryFn,
      wrapper,
    })
  })

  it('resets pagination cursor state when table filters change', async () => {
    const { tabularQueryFn, wrapper } = await mountRendererWithTabularSpy()
    const initialRefreshKey = getTableDataGridProps(wrapper).refreshKey

    const fetcher = getTableDataGridProps(wrapper).fetcher as TableDataGridFetcher
    await fetcher({
      mode: 'infinite',
      pageSize: 50,
      cursor: 'next-page',
    })
    await flushPromises()

    await wrapper.setProps({
      query: {
        ...query,
        filters: [
          {
            field: 'control_plane',
            operator: 'in',
            value: ['cp-id'],
          },
        ],
      },
    })
    await flushPromises()

    await expectFirstPageTabularQuery({
      expectedCallCount: 2,
      expectedQuery: {
        filters: [
          {
            field: 'control_plane',
            operator: 'in',
            value: ['cp-id'],
          },
        ],
      },
      initialRefreshKey,
      tabularQueryFn,
      wrapper,
    })
    expect(tabularQueryFn).toHaveBeenNthCalledWith(1, {
      datasource: 'platform',
      query: expect.objectContaining({
        cursor: 'next-page',
      }),
    }, expect.any(AbortController))
  })

  it('refetches from the first page when the effective table context changes', async () => {
    const { tabularQueryFn, wrapper } = await mountRendererWithTabularSpy()
    const initialRefreshKey = getTableDataGridProps(wrapper).refreshKey

    await wrapper.setProps({
      context: {
        ...context,
        filters: [
          {
            field: 'gateway_service',
            operator: 'in',
            value: ['service-id'],
          },
        ],
        timeSpec: {
          type: 'relative',
          time_range: '1h',
        },
        tz: 'America/Vancouver',
      },
    })
    await flushPromises()

    await expectFirstPageTabularQuery({
      expectedQuery: {
        filters: [
          {
            field: 'gateway_service',
            operator: 'in',
            value: ['service-id'],
          },
        ],
      },
      initialRefreshKey,
      tabularQueryFn,
      wrapper,
    })
  })

  it('does not refetch when non-query table renderer props change', async () => {
    const { tabularQueryFn, wrapper } = await mountRendererWithTabularSpy()
    const initialRefreshKey = getTableDataGridProps(wrapper).refreshKey

    await wrapper.setProps({
      context: {
        ...context,
        editable: true,
        showTileActions: false,
        zoomable: true,
      },
      height: 480,
    })
    await flushPromises()

    expect(getTableDataGridProps(wrapper).refreshKey).toBe(initialRefreshKey)
    expect(tabularQueryFn).not.toHaveBeenCalled()
  })

  it('uses response columns as header fallback after the first fetch', async () => {
    const tabularQueryFn = vi.fn().mockResolvedValue(response)
    const wrapper = mountRenderer({
      queryBridge: {
        tabularQueryFn,
      },
      queryOverride: {
        datasource: 'platform',
        page_size: 25,
      },
    })
    await flushPromises()

    expect(wrapper.getTestId('table-data-grid-stub').text()).toBe('')

    const fetcher = tableDataGridProps.mock.calls[0][0].fetcher
    await fetcher({
      mode: 'infinite',
      pageSize: 25,
    })
    await flushPromises()

    expect(isReady).toHaveBeenCalledOnce()
    expect(isReady.mock.invocationCallOrder[0]).toBeLessThan(tabularQueryFn.mock.invocationCallOrder[0])
    expect(wrapper.getTestId('table-data-grid-stub').text()).toBe('Control plane')
  })

  it('passes an error state to TableDataGrid when the tabular query function is missing', async () => {
    const wrapper = mountRenderer({
      queryBridge: {},
    })
    await flushPromises()

    const fetcher = tableDataGridProps.mock.calls[0][0].fetcher
    await expect(fetcher({
      mode: 'infinite',
      pageSize: 50,
    })).rejects.toThrow('AnalyticsBridge.tabularQueryFn is not defined')
    await flushPromises()

    expect(wrapper.getTestId('table-data-grid-stub').attributes('data-error')).toBe('true')
  })

  it('emits loading changes from the table state', async () => {
    const wrapper = mountRenderer()
    await flushPromises()

    wrapper.findComponent({ name: 'TableDataGrid' }).vm.$emit('state', {
      state: 'loading',
      hasData: false,
    })
    await nextTick()

    wrapper.findComponent({ name: 'TableDataGrid' }).vm.$emit('state', {
      state: 'success',
      hasData: true,
    })
    await nextTick()

    expect(wrapper.emitted('loading-change')).toEqual([[true], [false]])
  })
})

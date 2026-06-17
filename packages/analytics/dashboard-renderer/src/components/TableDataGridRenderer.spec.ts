import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import TableDataGridRenderer from './TableDataGridRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { DashboardRendererContextInternal } from '../types'
import type {
  AnalyticsBridge,
  PlatformTabularResponse,
  TableDataGridQuery,
} from '@kong-ui-public/analytics-utilities'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'

const tableDataGridProps = vi.hoisted(() => vi.fn())

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

const query: TableDataGridQuery = {
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
  queryOverride,
  queryBridge,
  queryReady = true,
}: {
  queryOverride?: TableDataGridQuery
  queryBridge?: Partial<AnalyticsBridge>
  queryReady?: boolean
} = {}) => mount(TableDataGridRenderer, {
  props: {
    context,
    height: 320,
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

describe('TableDataGridRenderer', () => {
  beforeEach(() => {
    tableDataGridProps.mockClear()
    vi.mocked(useDatasourceConfigStore).mockReturnValue({
      isReady: vi.fn().mockResolvedValue(undefined),
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
      refreshKey: 3,
    }))
    expect(tableDataGridProps.mock.calls[0][0].fetcher).toEqual(expect.any(Function))
  })

  it('uses response columns as header fallback after the first fetch', async () => {
    const wrapper = mountRenderer({
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

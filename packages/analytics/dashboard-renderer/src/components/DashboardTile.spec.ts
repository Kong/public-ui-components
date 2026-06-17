import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import DashboardTile from './DashboardTile.vue'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import TableDataGridRenderer from './TableDataGridRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'
import type { DashboardRendererContextInternal } from '../types'
import type { TileDefinition } from '@kong-ui-public/analytics-utilities'

vi.mock('./TimeseriesChartRenderer.vue', () => ({
  // eslint-disable-next-line vue/one-component-per-file
  default: defineComponent({
    name: 'TimeseriesChartRenderer',
    props: {
      chartOptions: {
        type: Object,
        required: true,
      },
      context: {
        type: Object,
        required: true,
      },
      exploreLink: {
        type: [String, Object],
        default: undefined,
      },
      height: {
        type: Number,
        required: true,
      },
      query: {
        type: Object,
        required: true,
      },
      queryReady: {
        type: Boolean,
        required: true,
      },
      refreshCounter: {
        type: Number,
        required: true,
      },
      requestsLink: {
        type: [String, Object],
        default: undefined,
      },
    },
    emits: ['select-chart-range', 'zoom-time-range'],
    setup(props) {
      return () => h('div', {
        'data-testid': 'timeseries-renderer-stub',
        'data-explore-link': props.exploreLink === undefined ? 'undefined' : String(props.exploreLink),
        'data-requests-link': props.requestsLink === undefined ? 'undefined' : String(props.requestsLink),
      })
    },
  }),
}))

vi.mock('./TableDataGridRenderer.vue', () => ({
  // eslint-disable-next-line vue/one-component-per-file
  default: defineComponent({
    name: 'TableDataGridRenderer',
    props: {
      context: {
        type: Object,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
      query: {
        type: Object,
        required: true,
      },
      queryReady: {
        type: Boolean,
        required: true,
      },
      refreshCounter: {
        type: Number,
        required: true,
      },
    },
    emits: ['loading-change'],
    setup() {
      return () => h('div', {
        'data-testid': 'table-data-grid-renderer-stub',
      })
    },
  }),
}))

const mockQueryProvider = {
  exploreBaseUrl: async () => 'http://test.com/explore',
  requestsBaseUrl: async () => 'http://test.com/requests',
  datasourceConfigFn: () => Promise.resolve([]),
  evaluateFeatureFlagFn: () => true,
}

const mockContext: DashboardRendererContextInternal = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '15m',
  },
  editable: false,
  tz: '',
  refreshInterval: 0,
  showTileActions: true,
  zoomable: false,
}

const baseDefinition: TileDefinition = {
  chart: {
    type: 'timeseries_line',
    chart_title: 'Test Chart',
  },
  query: {
    datasource: 'api_usage',
    metrics: ['request_count'],
    dimensions: ['time'],
    filters: [],
  },
}

const mountTile = (
  datasource: TileDefinition['query']['datasource'],
  dimensions: TileDefinition['query']['dimensions'] = ['time'],
  {
    hideActions = false,
    hideZoomActions = false,
  }: {
    hideActions?: boolean
    hideZoomActions?: boolean
  } = {},
) => {
  const definition = {
    ...baseDefinition,
    query: {
      ...baseDefinition.query,
      datasource,
      dimensions,
    },
  } as TileDefinition

  return mount(DashboardTile, {
    props: {
      definition,
      context: mockContext,
      hideActions,
      hideZoomActions,
      queryReady: true,
      refreshCounter: 0,
      tileId: '1',
    },
    shallow: true,
    global: {
      provide: {
        [INJECT_QUERY_PROVIDER]: mockQueryProvider,
      },
      stubs: {
        TimeseriesChartRenderer: false,
      },
    },
  })
}

describe('<DashboardTile /> zoom requests drilldown', () => {
  beforeEach(() => {
    setupPiniaTestStore()
    const analyticsConfigStore = useAnalyticsConfigStore()
    analyticsConfigStore.analyticsConfig = { analytics: { percentiles: true } } as any
  })

  it('does not populate requests zoom actions for platform tiles', async () => {
    const wrapper = mountTile('platform')
    await flushPromises()

    const renderer = wrapper.findComponent(TimeseriesChartRenderer)
    expect(renderer.exists()).toBe(true)
    expect(renderer.props('requestsLink')).toBeUndefined()

    renderer.vm.$emit('select-chart-range', {
      type: 'absolute',
      start: new Date('2024-01-01T00:00:00Z'),
      end: new Date('2024-01-01T01:00:00Z'),
    })

    await nextTick()

    expect(wrapper.findComponent(TimeseriesChartRenderer).props('requestsLink')).toBeUndefined()
    expect(wrapper.findComponent(TimeseriesChartRenderer).props('exploreLink')).toBeDefined()
  })

  it('still populates requests zoom actions for api_usage tiles', async () => {
    const wrapper = mountTile('api_usage')
    await flushPromises()

    const renderer = wrapper.findComponent(TimeseriesChartRenderer)
    expect(renderer.exists()).toBe(true)
    expect(renderer.props('requestsLink')).toMatchObject({ href: '' })

    renderer.vm.$emit('select-chart-range', {
      type: 'absolute',
      start: new Date('2024-01-01T00:00:00Z'),
      end: new Date('2024-01-01T01:00:00Z'),
    })

    await nextTick()

    expect((wrapper.findComponent(TimeseriesChartRenderer).props('requestsLink') as { href?: string } | undefined)?.href).toContain('http://test.com/requests?q=')
  })

  it('does not populate zoom action links when zoom actions are hidden', async () => {
    const wrapper = mountTile('api_usage', ['time'], { hideZoomActions: true })
    await flushPromises()

    const renderer = wrapper.findComponent(TimeseriesChartRenderer)
    expect(renderer.exists()).toBe(true)
    expect(renderer.props('requestsLink')).toBeUndefined()
    expect(renderer.props('exploreLink')).toBeUndefined()

    renderer.vm.$emit('select-chart-range', {
      type: 'absolute',
      start: new Date('2024-01-01T00:00:00Z'),
      end: new Date('2024-01-01T01:00:00Z'),
    })

    await nextTick()

    expect(wrapper.findComponent(TimeseriesChartRenderer).props('requestsLink')).toBeUndefined()
    expect(wrapper.findComponent(TimeseriesChartRenderer).props('exploreLink')).toBeUndefined()
  })

  it('shows the as-of-today badge for non-timeseries platform tiles', async () => {
    const wrapper = mountTile('platform', ['status_code'])
    await flushPromises()

    const badge = wrapper.getTestId('time-range-badge')
    expect(badge.text()).toContain('As of today')
  })

  it('does not show the as-of-today badge when the time dimension is present', async () => {
    const wrapper = mountTile('platform', ['time'])
    await flushPromises()

    expect(wrapper.findTestId('time-range-badge').exists()).toBe(false)
  })
})

describe('<DashboardTile /> table tiles', () => {
  beforeEach(() => {
    setupPiniaTestStore()
    const analyticsConfigStore = useAnalyticsConfigStore()
    analyticsConfigStore.analyticsConfig = { analytics: { percentiles: true } } as any
  })

  it('dispatches table tiles to the table data grid renderer', () => {
    const tableDefinition: TileDefinition = {
      config: {
        title: 'Table Tile',
      },
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: ['control_plane'],
      },
    }

    const wrapper = mount(DashboardTile, {
      props: {
        context: mockContext,
        definition: tableDefinition,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
        tileType: 'table',
      },
      shallow: true,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
        stubs: {
          TableDataGridRenderer: false,
        },
      },
    })

    expect(wrapper.findComponent(TableDataGridRenderer).exists()).toBe(true)
    expect(wrapper.findComponent(TimeseriesChartRenderer).exists()).toBe(false)
    expect(wrapper.findComponent(TableDataGridRenderer).props()).toMatchObject({
      context: mockContext,
      query: tableDefinition.query,
      queryReady: true,
      refreshCounter: 0,
    })
  })

  it('shows editable tile actions for table tiles', () => {
    const tableDefinition: TileDefinition = {
      config: {
        title: 'Table Tile',
      },
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: ['control_plane'],
      },
    }

    const wrapper = mount(DashboardTile, {
      props: {
        context: {
          ...mockContext,
          editable: true,
        },
        definition: tableDefinition,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
        tileType: 'table',
      },
      shallow: true,
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
        stubs: {
          TableDataGridRenderer: false,
        },
      },
    })

    expect(wrapper.findTestId('tile-actions-1').exists()).toBe(true)
    expect(wrapper.findTestId('edit-tile-1').exists()).toBe(true)
    expect(wrapper.findTestId('kebab-action-menu-1').exists()).toBe(true)
    expect(wrapper.findTestId('chart-jump-to-explore-1').exists()).toBe(false)
    expect(wrapper.findTestId('chart-jump-to-requests-1').exists()).toBe(false)
    expect(wrapper.findTestId('chart-csv-export-1').exists()).toBe(false)
  })
})

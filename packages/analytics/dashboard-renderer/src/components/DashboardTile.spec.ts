import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, type PropType } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import DashboardTile from './DashboardTile.vue'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import TableDataGridRenderer from './TableDataGridRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import type { DashboardRendererContext } from '../types'
import type { TileDefinition } from '@kong-ui-public/analytics-utilities'
import Kongponents from '@kong/kongponents'

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
        default: undefined,
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
      activeMetric: {
        type: String,
        default: undefined,
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
        default: undefined,
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

const dropdownSlotStubs = {
  // eslint-disable-next-line vue/one-component-per-file
  KDropdown: defineComponent({
    setup(_, { slots }) {
      return () => h('div', [
        slots.default?.(),
        slots.items?.(),
      ])
    },
  }),
  // eslint-disable-next-line vue/one-component-per-file
  KDropdownItem: defineComponent({
    props: {
      item: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () => h('a', {
        href: (props.item as { to?: string } | undefined)?.to,
      }, slots.default?.() ?? (props.item as { label?: string } | undefined)?.label)
    },
  }),
}

// eslint-disable-next-line vue/one-component-per-file -- Local stub exercises the tile header without rendering Kongponents.
const segmentedControlStub = defineComponent({
  name: 'KSegmentedControl',
  props: {
    modelValue: {
      type: String,
      default: undefined,
    },
    options: {
      type: Array as PropType<Array<{ value: string, label: string }>>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { 'data-testid': 'metric-selector' }, props.options.map(option => h('button', {
      'data-testid': `metric-option-${option.value}`,
      onClick: () => emit('update:modelValue', option.value),
    }, option.label)))
  },
})

const mockQueryProvider = {
  configFn: () => Promise.resolve({ analytics: { percentiles: true }, requests: null }),
  exploreBaseUrl: async () => 'http://test.com/explore',
  requestsBaseUrl: async () => 'http://test.com/requests',
  datasourceConfigFn: () => Promise.resolve([
    {
      name: 'api_usage',
      showInUI: true,
      fields: [],
      timeRangeOptions: ['15m', '1h', '24h', '7d', '30d'],
    },
    {
      name: 'managed_cache_usage',
      showInUI: true,
      fields: [],
      timeRangeOptions: ['15m', '1h', '6h', '12h', '24h', '7d'],
    },
  ]),
  evaluateFeatureFlagFn: () => true,
}

const mockContext: DashboardRendererContext = {
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
      plugins: [Kongponents],
      provide: {
        [INJECT_QUERY_PROVIDER]: mockQueryProvider,
      },
      stubs: {
        KBadge: false,
        KTooltip: false,
        KSegmentedControl: segmentedControlStub,
        TimeseriesChartRenderer: false,
      },
    },
  })
}

const groupedMetricsResult = {
  data: [{
    timestamp: '2026-09-09T15:00:00Z',
    event: { gateway: 'one', response_latency_average: 10, response_latency_p99: 20 },
  }],
  meta: {
    start: '2026-09-09T15:00:00Z',
    end: '2026-09-09T16:00:00Z',
    granularity_ms: 3600000,
    metric_names: ['response_latency_average', 'response_latency_p99'],
    metric_units: { response_latency_average: 'ms', response_latency_p99: 'ms' },
    query_id: 'test-query',
    display: { gateway: { one: { name: 'Gateway one' } } },
  },
} as const

describe('<DashboardTile /> zoom requests drilldown', () => {
  beforeEach(() => {
    setupPiniaTestStore()
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

  it('shows the as-of-today badge for non-timeseries platform_usage tiles', async () => {
    const wrapper = mountTile('platform_usage', ['status_code'])
    await flushPromises()

    const badge = wrapper.getTestId('time-range-badge')
    expect(badge.text()).toContain('As of today')
  })

  it('does not show the as-of-today badge when the time dimension is present', async () => {
    const wrapper = mountTile('platform', ['time'])
    await flushPromises()

    expect(wrapper.findTestId('time-range-badge').exists()).toBe(false)
  })

  it('warns when a relative timeframe is unsupported by the datasource', async () => {
    const wrapper = mountTile('managed_cache_usage')
    await wrapper.setProps({
      context: {
        ...mockContext,
        timeSpec: {
          type: 'relative',
          time_range: '30d',
        },
      },
    })
    await flushPromises()

    const badge = wrapper.getTestId('unsupported-time-range-badge')
    const badgeComponent = wrapper.findAllComponents({ name: 'KBadge' })
      .find(component => component.attributes('data-testid') === 'unsupported-time-range-badge')

    expect(badge.exists()).toBe(true)
    expect(badgeComponent?.props('tooltip')).toContain('limited to the maximum supported timeframe')
  })

  it.each([
    ['managed cache supports the selected timeframe', 'managed_cache_usage', '7d'],
    ['another datasource supports the selected timeframe', 'api_usage', '30d'],
  ] as const)('does not show the unsupported timeframe warning when %s', async (_, datasource, timeRange) => {
    const wrapper = mountTile(datasource)
    await wrapper.setProps({
      context: {
        ...mockContext,
        timeSpec: {
          type: 'relative',
          time_range: timeRange,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findTestId('unsupported-time-range-badge').exists()).toBe(false)
  })

  it('warns when an absolute timeframe exceeds the datasource maximum', async () => {
    const wrapper = mountTile('managed_cache_usage')
    await wrapper.setProps({
      context: {
        ...mockContext,
        timeSpec: {
          type: 'absolute',
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-09T00:00:00Z'),
        },
      },
    })
    await flushPromises()

    expect(wrapper.findTestId('unsupported-time-range-badge').exists()).toBe(true)
  })
})

describe('<DashboardTile /> metric selector', () => {
  beforeEach(() => {
    setupPiniaTestStore()
  })

  it('shows the grouped time series selector, owns its selection, and passes it to the renderer', async () => {
    const wrapper = mountTile('api_usage')
    const renderer = wrapper.findComponent(TimeseriesChartRenderer)

    renderer.vm.$emit('chart-data', groupedMetricsResult)
    await nextTick()

    expect(wrapper.findTestId('metric-selector').exists()).toBe(true)
    expect(renderer.props('activeMetric')).toBe('response_latency_average')

    await wrapper.getTestId('metric-option-response_latency_p99').trigger('click')

    expect(renderer.props('activeMetric')).toBe('response_latency_p99')

    renderer.vm.$emit('chart-data', {
      ...groupedMetricsResult,
      meta: { ...groupedMetricsResult.meta, metric_names: ['response_latency_average'] },
    })
    await nextTick()

    expect(wrapper.findTestId('metric-selector').exists()).toBe(false)
    expect(renderer.props('activeMetric')).toBe('response_latency_average')
  })

  it.each([
    ['single metric', { ...groupedMetricsResult.meta, metric_names: ['response_latency_average'] }],
    ['without a group-by display', { ...groupedMetricsResult.meta, display: {} }],
  ])('hides the selector for %s data', async (_, meta) => {
    const wrapper = mountTile('api_usage')
    const renderer = wrapper.findComponent(TimeseriesChartRenderer)

    renderer.vm.$emit('chart-data', { ...groupedMetricsResult, meta })
    await nextTick()

    expect(wrapper.findTestId('metric-selector').exists()).toBe(false)
  })
})

describe('<DashboardTile /> table tiles', () => {
  beforeEach(() => {
    setupPiniaTestStore()
  })

  it('dispatches table tiles to the table data grid renderer', () => {
    const tableDefinition: TileDefinition = {
      chart: {
        type: 'table',
        chart_title: 'Table Tile',
      },
      query: {
        datasource: 'platform',
        entity: 'route',
        columns: ['control_plane'],
        filters: [
          {
            field: 'route',
            operator: 'in',
            value: ['route-id'],
          },
        ],
      },
    }
    const tableContext = {
      ...mockContext,
      filters: [
        {
          field: 'control_plane',
          operator: 'in',
          value: ['cp-id'],
        },
      ],
    }

    const wrapper = mount(DashboardTile, {
      props: {
        context: tableContext,
        definition: tableDefinition,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      shallow: true,
      global: {
        plugins: [Kongponents],
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
      context: tableContext,
      query: tableDefinition.query,
      queryReady: true,
      refreshCounter: 0,
    })
    expect(wrapper.findComponent(TableDataGridRenderer).props('height')).toBeGreaterThan(0)
  })

  it('shows editable tile actions and explore links for table tiles', async () => {
    const tableDefinition: TileDefinition = {
      chart: {
        type: 'table',
        chart_title: 'Table Tile',
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
      },
      shallow: true,
      global: {
        plugins: [Kongponents],
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
        stubs: {
          ...dropdownSlotStubs,
          TableDataGridRenderer: false,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findTestId('tile-actions-1').exists()).toBe(true)
    expect(wrapper.findTestId('edit-tile-1').exists()).toBe(true)
    expect(wrapper.findTestId('kebab-action-menu-1').exists()).toBe(true)
    expect(wrapper.findTestId('chart-jump-to-explore-1').exists()).toBe(true)
    expect(wrapper.findTestId('chart-jump-to-requests-1').exists()).toBe(false)
    expect(wrapper.findTestId('chart-csv-export-1').exists()).toBe(false)
  })

  it('shows table explore links when edit actions are hidden', async () => {
    const tableDefinition: TileDefinition = {
      chart: {
        type: 'table',
        chart_title: 'Table Tile',
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
          editable: false,
        },
        definition: tableDefinition,
        queryReady: true,
        refreshCounter: 0,
        tileId: '1',
      },
      shallow: true,
      global: {
        plugins: [Kongponents],
        provide: {
          [INJECT_QUERY_PROVIDER]: mockQueryProvider,
        },
        stubs: {
          ...dropdownSlotStubs,
          TableDataGridRenderer: false,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findTestId('tile-actions-1').exists()).toBe(true)
    expect(wrapper.findTestId('edit-tile-1').exists()).toBe(false)
    expect(wrapper.findTestId('chart-jump-to-explore-1').exists()).toBe(true)
    expect(wrapper.findTestId('chart-jump-to-requests-1').exists()).toBe(false)
  })
})

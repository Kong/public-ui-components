import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import DashboardTile from './DashboardTile.vue'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'
import type { DashboardRendererContextInternal } from '../types'
import type { TileDefinition } from '@kong-ui-public/analytics-utilities'

vi.mock('./TimeseriesChartRenderer.vue', () => ({
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

import { defineComponent, h } from 'vue'
import { describe, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ExternalLink } from '@kong-ui-public/analytics-chart'
import AnalyticsEchartsRenderer from './AnalyticsEchartsRenderer.vue'

const timeseriesChartProps = vi.fn()
const crossSectionChartProps = vi.fn()

vi.mock('@kong-ui-public/analytics-echarts', () => ({
  TimeseriesChart: defineComponent({
    name: 'TimeseriesChart',
    props: {
      exploreLink: {
        type: Object,
        default: undefined,
      },
      requestsLink: {
        type: Object,
        default: undefined,
      },
      timeseriesZoom: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        required: true,
      },
    },
    setup: (props) => {
      timeseriesChartProps({
        exploreLink: props.exploreLink,
        requestsLink: props.requestsLink,
        timeseriesZoom: props.timeseriesZoom,
        type: props.type,
      })

      return () => h('div', { 'data-testid': 'timeseries-chart' })
    },
  }),
  CrossSectionChart: defineComponent({
    name: 'CrossSectionChart',
    props: {
      type: {
        type: String,
        required: true,
      },
    },
    setup: (props) => {
      crossSectionChartProps({
        type: props.type,
      })

      return () => h('div', { 'data-testid': 'cross-section-chart' })
    },
  }),
}))

vi.mock('./QueryDataProvider.vue', () => ({
  default: defineComponent({
    name: 'QueryDataProvider',
    props: {
      context: {
        type: Object,
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
    emits: ['chart-data'],
    setup: (_props, { slots }) => {
      const data = {
        data: [],
        meta: {},
      }

      return () => slots.default?.({ data })
    },
  }),
}))

const baseContext = {
  chartRenderer: 'echarts' as const,
  editable: false,
  filters: [],
  refreshInterval: 0,
  showTileActions: false,
  timeSpec: { type: 'relative' as const, time_range: '15m' },
  tz: 'UTC',
  zoomable: true,
}

const baseQuery = {
  datasource: 'api_usage',
  filters: [],
  metrics: ['request_count'],
}

describe('AnalyticsEchartsRenderer', () => {
  beforeEach(() => {
    timeseriesChartProps.mockClear()
    crossSectionChartProps.mockClear()
  })

  it('forwards zoom action links to timeseries charts', () => {
    const exploreLink: ExternalLink = { href: '#explore?foo=bar' }
    const requestsLink: ExternalLink = { href: '#requests?foo=bar' }

    mount(AnalyticsEchartsRenderer, {
      props: {
        chartOptions: {
          type: 'timeseries_line',
        },
        context: baseContext,
        exploreLink,
        height: 320,
        query: baseQuery,
        queryReady: true,
        refreshCounter: 0,
        requestsLink,
      },
    })

    expect(timeseriesChartProps).toHaveBeenCalledTimes(1)
    expect(timeseriesChartProps.mock.lastCall?.[0]).toEqual({
      exploreLink,
      requestsLink,
      timeseriesZoom: true,
      type: 'timeseries_line',
    })
    expect(crossSectionChartProps).not.toHaveBeenCalled()
  })
})

import type { ExploreResultV4, SankeyChartOptions, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { SankeyNode } from '@kong-ui-public/echarts'
import type { DashboardRendererContext } from '../types'

import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import SankeyRenderer from './SankeyRenderer.vue'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'

/** Model -> consumer requests: six models, each with one consumer */
let records: Array<[model: string, consumer: string]> = []

/** A result grouped by the query's dimensions, like the API */
const resultFor = (query: ValidDashboardChartQuery): ExploreResultV4 => {
  const [modelDimension, consumerDimension] = query.dimensions as string[]

  return {
    data: records.map(([model, consumer], index) => ({
      timestamp: '2026-11-11T00:00:00Z',
      event: { [modelDimension]: model, [consumerDimension]: consumer, ai_request_count: 100 - index },
    })),
    meta: {
      start: '2026-11-11T00:00:00Z',
      end: '2026-11-18T00:00:00Z',
      granularity_ms: 604800000,
      query_id: 'query',
      metric_names: ['ai_request_count'],
      display: {
        [modelDimension]: Object.fromEntries(records.map(([model]) => [model, { name: model }])),
        [consumerDimension]: Object.fromEntries(records.map(([, consumer]) => [consumer, { name: consumer }])),
      },
    },
  }
}

// Renders the slot with a result for the query it was given
const QueryDataProvider = defineComponent({
  name: 'QueryDataProvider',
  props: { query: { type: Object, required: true } },
  setup: (props, { slots }) => () => h('div', slots.default?.({ data: resultFor(props.query as ValidDashboardChartQuery) })),
})

const context: DashboardRendererContext = {
  filters: [],
  timeSpec: { type: 'relative', time_range: '7d' },
  editable: false,
  refreshInterval: 0,
  showTileActions: true,
  tz: 'Etc/UTC',
}

const baseQuery = {
  datasource: 'llm_usage',
  dimensions: ['ai_gateway_model', 'oidc_credential'],
  metrics: ['ai_request_count'],
} as ValidDashboardChartQuery

const chartOptions: SankeyChartOptions = { type: 'sankey' }

const mountRenderer = (query: Partial<ValidDashboardChartQuery> = {}) => mount(SankeyRenderer, {
  props: {
    query: { ...baseQuery, ...query } as ValidDashboardChartQuery,
    context,
    queryReady: true,
    chartOptions,
    height: 400,
    refreshCounter: 0,
  },
  global: {
    stubs: {
      QueryDataProvider,
      // The canvas isn't the renderer's logic, and there's no canvas in tests
      SankeyChart: true,
      KEmptyState: { template: '<div v-bind="$attrs" />' },
    },
  },
})

/** The first column's nodes, the ones with a total */
const rankedNodeIds = (wrapper: ReturnType<typeof mountRenderer>) => (
  (wrapper.getComponent({ name: 'SankeyChart' }).props('nodes') as SankeyNode[]).filter(({ total }) => total !== undefined).map(({ id }) => id)
)

describe('<SankeyRenderer />', () => {
  beforeEach(() => {
    setupPiniaTestStore()
    records = ['a', 'b', 'c', 'd', 'e', 'f'].map((model) => [model, `user-${model}`])
  })

  it('keeps the query\'s limit of nodes in each column', () => {
    expect(rankedNodeIds(mountRenderer({ limit: 2 }))).toEqual(['ai_gateway_model:a', 'ai_gateway_model:b'])
  })

  it('explains that a query with one dimension can\'t be shown', () => {
    const wrapper = mountRenderer({ dimensions: ['ai_gateway_model'] })

    expect(wrapper.find('[data-testid="sankey-unsupported"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(false)
  })

  it('shows the empty state when nothing links', () => {
    records = []
    const wrapper = mountRenderer()

    expect(wrapper.find('[data-testid="no-data-in-report"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SankeyChart' }).exists()).toBe(false)
  })
})

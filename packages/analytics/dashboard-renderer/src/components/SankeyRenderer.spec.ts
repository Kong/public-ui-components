import type { ExploreResultV4, SankeyChartOptions, ValidDashboardChartQuery } from '@kong-ui-public/analytics-utilities'
import type { SankeyNode } from '@kong-ui-public/echarts'
import type { DashboardRendererContext } from '../types'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import SankeyRenderer from './SankeyRenderer.vue'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'

vi.mock('@kong-ui-public/echarts', () => ({
  // eslint-disable-next-line vue/one-component-per-file
  SankeyChart: defineComponent({
    name: 'SankeyChart',
    props: { nodes: { type: Array, default: () => [] } },
    emits: ['node-click'],
    setup: () => () => h('div', { 'data-testid': 'sankey-chart-stub' }),
  }),
}))

vi.mock('@kong-ui-public/echarts/dist/style.css', () => ({}))

const records: Array<Record<string, string>> = [
  { ai_provider: 'openai', ai_gateway_model: 'gpt', oidc_credential: 'alex' },
  { ai_provider: 'anthropic', ai_gateway_model: 'claude', oidc_credential: 'sam' },
]

/** A result grouped by the query's dimensions, like the API */
const resultFor = (query: ValidDashboardChartQuery): ExploreResultV4 => {
  const dimensions = query.dimensions as string[]

  return {
    data: records.map((record) => ({
      timestamp: '2026-11-11T00:00:00Z',
      event: { ...Object.fromEntries(dimensions.map((dimension) => [dimension, record[dimension]])), ai_request_count: 10 },
    })),
    meta: {
      start: '2026-11-11T00:00:00Z',
      end: '2026-11-18T00:00:00Z',
      granularity_ms: 604800000,
      query_id: 'query',
      metric_names: ['ai_request_count'],
      display: Object.fromEntries(dimensions.map((dimension) => [dimension, Object.fromEntries(records.map((record) => [record[dimension], { name: record[dimension] }]))])),
    },
  }
}

// Renders the slot with a result for the query it was given, so the test can read that query
// eslint-disable-next-line vue/one-component-per-file
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

const query = {
  datasource: 'llm_usage',
  dimensions: ['ai_gateway_model', 'oidc_credential'],
  metrics: ['ai_request_count'],
  filters: [{ field: 'ai_provider', operator: 'not_empty' }],
} as ValidDashboardChartQuery

const chartOptions: SankeyChartOptions = {
  type: 'sankey',
  views: [
    { label: 'Models', dimensions: ['ai_gateway_model', 'oidc_credential'] },
    { label: 'Users', dimensions: ['oidc_credential', 'ai_provider', 'ai_gateway_model'] },
    { label: 'Providers', dimensions: ['ai_provider', 'ai_gateway_model', 'oidc_credential'] },
  ],
}

const mountRenderer = (props: { activeView?: number, chartOptions?: SankeyChartOptions } = {}) => mount(SankeyRenderer, {
  props: {
    query,
    context,
    queryReady: true,
    chartOptions,
    height: 400,
    refreshCounter: 0,
    ...props,
  },
  global: {
    stubs: {
      QueryDataProvider,
      KEmptyState: true,
      KButton: { template: '<button v-bind="$attrs"><slot /></button>' },
    },
  },
})

const providerQuery = (wrapper: ReturnType<typeof mountRenderer>) => wrapper.getComponent(QueryDataProvider).props('query') as ValidDashboardChartQuery

const chart = (wrapper: ReturnType<typeof mountRenderer>) => wrapper.getComponent({ name: 'SankeyChart' })

const clickNode = async (wrapper: ReturnType<typeof mountRenderer>, id: string) => {
  const node = (chart(wrapper).props('nodes') as SankeyNode[]).find((node) => node.id === id)

  chart(wrapper).vm.$emit('node-click', node)
  await flushPromises()
}

describe('<SankeyRenderer />', () => {
  beforeEach(() => {
    setupPiniaTestStore()
  })

  it('queries the selected view\'s dimensions', () => {
    expect(providerQuery(mountRenderer({ activeView: 1 })).dimensions).toEqual(['oidc_credential', 'ai_provider', 'ai_gateway_model'])
  })

  it('queries the query\'s own dimensions without views', () => {
    expect(providerQuery(mountRenderer({ chartOptions: { type: 'sankey' } })).dimensions).toEqual(['ai_gateway_model', 'oidc_credential'])
  })

  it('ranks the selected view\'s first column', async () => {
    const wrapper = mountRenderer({ activeView: 0 })
    // Ranked nodes are the ones sized by their total
    const rankedNodeIds = () => (chart(wrapper).props('nodes') as SankeyNode[]).filter(({ value }) => value !== undefined).map(({ id }) => id)

    expect(rankedNodeIds()).toEqual(['ai_gateway_model:gpt', 'ai_gateway_model:claude'])

    await wrapper.setProps({ activeView: 2 })

    expect(rankedNodeIds()).toEqual(['ai_provider:openai', 'ai_provider:anthropic'])
  })

  it('narrows the query to a clicked first-column node and names it', async () => {
    const wrapper = mountRenderer({ activeView: 1 })

    await clickNode(wrapper, 'oidc_credential:alex')

    expect(providerQuery(wrapper).filters).toEqual([
      { field: 'ai_provider', operator: 'not_empty' },
      { field: 'oidc_credential', operator: 'in', value: ['alex'] },
    ])
    expect(wrapper.get('[data-testid="sankey-narrowed-to"]').text()).toContain('alex')
  })

  it('ignores clicks on nodes outside the first column', async () => {
    const wrapper = mountRenderer({ activeView: 1 })

    await clickNode(wrapper, 'ai_provider:openai')

    expect(providerQuery(wrapper).filters).toEqual(query.filters)
    expect(wrapper.find('[data-testid="sankey-narrowed-to"]').exists()).toBe(false)
  })

  it('shows all values again from the narrowed bar', async () => {
    const wrapper = mountRenderer({ activeView: 1 })

    await clickNode(wrapper, 'oidc_credential:alex')
    await wrapper.get('[data-testid="sankey-show-all"]').trigger('click')

    expect(providerQuery(wrapper).filters).toEqual(query.filters)
  })

  it('shows all values again after switching views', async () => {
    const wrapper = mountRenderer({ activeView: 1 })

    await clickNode(wrapper, 'oidc_credential:alex')
    await wrapper.setProps({ activeView: 0 })

    expect(providerQuery(wrapper).filters).toEqual(query.filters)
  })
})

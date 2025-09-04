import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import useContextLinks from './useContextLinks'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'

const ONE_HOUR_MS = 3600000
const ONE_DAY_MS = 86400000

vi.mock('@kong-ui-public/analytics-utilities', () => ({
  getFieldDataSources: vi.fn((field: string) => {
    if (field === 'gateway_service') {
      return ['api_usage']
    }
    if (field === 'ai_provider') {
      return ['llm_usage']
    }
    if (field === 'shared_field') {
      return ['api_usage', 'llm_usage']
    }
    return []
  }),
  msToGranularity: vi.fn((ms: number) => {
    if (ms === ONE_HOUR_MS) return 'hourly'
    if (ms === ONE_DAY_MS) return 'daily'
    return 'auto'
  }),
}))

const analyticsConfig = { analytics: true, percentiles: true }

vi.mock('@kong-ui-public/analytics-config-store', () => ({
  useAnalyticsConfigStore: vi.fn(() => analyticsConfig),
}))

const makeFilter = (field: string) => ({ field, operator: 'in', value: ['x'] })

const absoluteTimeRange = {
  type: 'absolute',
  start: 1000,
  end: 5000,
} as any

const relativeTimeRange = {
  type: 'relative',
  time_range: '24h',
} as any

const mockChartData = (granularityMs = ONE_HOUR_MS) => computed(() => ({
  data: [],
  meta: {
    granularity_ms: granularityMs,
    start_ms: 1111,
    end_ms: 2222,
  },
})) as any

function mountComposable({
  exploreBase = '#explore',
  requestsBase = '#requests',
  chartType = 'line',
  datasource = 'api_usage',
  explicitGranularity,
  queryFilters = [],
  contextFilters = [],
  timeRange,
  chartDataGranularityMs = ONE_HOUR_MS,
}: {
  exploreBase?: string
  requestsBase?: string
  chartType?: string
  datasource?: string
  explicitGranularity?: string | undefined
  queryFilters?: any[]
  contextFilters?: any[]
  timeRange?: any
  chartDataGranularityMs?: number
}) {
  const queryBridge = {
    exploreBaseUrl: vi.fn(async () => exploreBase),
    requestsBaseUrl: vi.fn(async () => requestsBase),
  }

  const context = computed(() => ({
    filters: contextFilters,
    timeSpec: relativeTimeRange,
  }))

  const definition = computed(() => ({
    chart: { type: chartType },
    query: {
      datasource,
      metrics: ['request_count'],
      dimensions: ['gateway_service'],
      filters: queryFilters,
      granularity: explicitGranularity,
      time_range: timeRange,
    },
  }))

  const chartData = mockChartData(chartDataGranularityMs)

  const wrapper = mount({
    template: '<div />',
    setup() {
      const result = useContextLinks({
        queryBridge: queryBridge as any,
        context: context as any,
        definition: definition as any,
        chartData,
      })
      return { ...result }
    },
  })

  return {
    wrapper,
    queryBridge,
  }
}

describe('useContextLinks', () => {
  beforeEach(() => {
    setupPiniaTestStore({ createVueApp: true })
    vi.clearAllMocks()
  })

  it('builds explore link with datasource-scoped filters and explicit granularity', async () => {
    const { wrapper } = mountComposable({
      explicitGranularity: 'minute',
      contextFilters: [makeFilter('gateway_service'), makeFilter('ai_provider')],
      queryFilters: [makeFilter('gateway_service')],
      timeRange: relativeTimeRange,
    })

    // Let onMounted async calls resolve
    await flushPromises()

    const url = wrapper.vm.exploreLinkKebabMenu as string
    expect(url).toContain('#explore?')

    const params = new URLSearchParams(url.split('?')[1])
    const qRaw = params.get('q')
    expect(qRaw).toBeTruthy()

    const parsed = JSON.parse(qRaw!)
    // Only gateway_service filters should remain (ai_provider belongs only to llm_usage)
    expect(parsed.filters.length).toBe(2)
    expect(parsed.filters.every((f: any) => f.field === 'gateway_service')).toBe(true)
    expect(parsed.granularity).toBe('minute')
    expect(params.get('d')).toBe('api_usage')
    expect(params.get('c')).toBe('line')
  })

  it('falls back to chartData granularity via msToGranularity when query.granularity not set', async () => {
    const { wrapper } = mountComposable({
      explicitGranularity: undefined,
      chartDataGranularityMs: ONE_DAY_MS,
    })
    await flushPromises()

    const params = new URLSearchParams((wrapper.vm.exploreLinkKebabMenu as string).split('?')[1])
    const parsed = JSON.parse(params.get('q')!)
    expect(parsed.granularity).toBe('daily')
  })

  it('cannot generate explore link for unsupported datasource', async () => {
    const { wrapper } = mountComposable({
      datasource: 'random_unsupported_source',
    })
    await flushPromises()

    expect(wrapper.vm.exploreLinkKebabMenu).toBe('')
    expect(wrapper.vm.canGenerateExploreLink).toBe(false)
  })

  it('maps basic to api_usage for explore link', async () => {
    const { wrapper } = mountComposable({
      datasource: 'basic',
    })
    await flushPromises()

    const params = new URLSearchParams((wrapper.vm.exploreLinkKebabMenu as string).split('?')[1])
    expect(params.get('d')).toBe('api_usage')
  })

  it('falls back to api_usage when query datasource is not provided', async () => {
    const { wrapper } = mountComposable({ datasource: undefined })
    await flushPromises()

    const params = new URLSearchParams((wrapper.vm.exploreLinkKebabMenu as string).split('?')[1])
    expect(params.get('d')).toBe('api_usage')
  })

  it('does not build explore link if base URL missing', async () => {
    const { wrapper } = mountComposable({
      exploreBase: '',
    })
    await flushPromises()

    expect(wrapper.vm.exploreLinkKebabMenu).toBe('')
  })

  it('hides kebab for golden_signals/top_n/gauge chart types', async () => {
    for (const type of ['golden_signals', 'top_n', 'gauge']) {
      const { wrapper } = mountComposable({ chartType: type })
      await flushPromises()
      expect(wrapper.vm.canShowKebabMenu).toBe(false)
      expect(wrapper.vm.exploreLinkKebabMenu).toBe('')
      expect(wrapper.vm.requestsLinkKebabMenu).toBe('')
    }
  })

  it('prevents requests link for llm_usage datasource', async () => {
    const { wrapper } = mountComposable({ datasource: 'llm_usage' })
    await flushPromises()

    expect(wrapper.vm.canGenerateRequestsLink).toBe(false)
    expect(wrapper.vm.requestsLinkKebabMenu).toBe('')
  })

  it('builds requests link for kebab menu (absolute time range uses chartData.meta start/end)', async () => {
    const { wrapper } = mountComposable({
      timeRange: absoluteTimeRange,
      contextFilters: [makeFilter('gateway_service')],
    })
    await flushPromises()

    const url = wrapper.vm.requestsLinkKebabMenu as string
    expect(url.startsWith('#requests?q=')).toBe(true)
    const q = decodeURIComponent(url.split('=')[1])
    const parsed = JSON.parse(q)

    expect(parsed.filter.length).toBe(1)
    expect(parsed.timeframe.timePeriodsKey).toBe('custom')
    // Should use chartData.meta values, not the raw timeRange.start/end
    expect(parsed.timeframe.start).toBe(1111)
    expect(parsed.timeframe.end).toBe(2222)
  })

  it('builds requests link with relative time range', async () => {
    const { wrapper } = mountComposable({
      timeRange: relativeTimeRange,
    })
    await flushPromises()

    const url = wrapper.vm.requestsLinkKebabMenu as string
    const parsed = JSON.parse(decodeURIComponent(url.split('=')[1]))
    expect(parsed.timeframe.timePeriodsKey).toBe('24h')
    expect(parsed.timeframe.start).toBeUndefined()
    expect(parsed.timeframe.end).toBeUndefined()
  })

  it('buildRequestsQueryZoomActions uses provided absolute range start/end directly', async () => {
    const { wrapper } = mountComposable({
      timeRange: absoluteTimeRange,
    })
    await flushPromises()

    // @ts-ignore we're testing an internal method directly
    const result = wrapper.vm.buildRequestsQueryZoomActions(absoluteTimeRange)
    expect(result.timeframe.timePeriodsKey).toBe('custom')
    expect(result.timeframe.start).toBe(1000)
    expect(result.timeframe.end).toBe(5000)
  })

  it('does not build requests link or explore link if analytics/percentiles disabled', async () => {
    const { wrapper } = mountComposable({})
    await flushPromises()

    expect(wrapper.vm.canGenerateExploreLink).toBe(true)
    expect(wrapper.vm.canGenerateRequestsLink).toBe(true)
    expect(wrapper.vm.exploreLinkKebabMenu).not.toBe('')
    expect(wrapper.vm.requestsLinkKebabMenu).not.toBe('')

    analyticsConfig.analytics = false
    analyticsConfig.percentiles = false

    await flushPromises()
    // Need to remount composable to re-evaluate computed properties
    const { wrapper: wrapper2 } = mountComposable({})
    await flushPromises()

    expect(wrapper2.vm.canGenerateExploreLink).toBe(false)
    expect(wrapper2.vm.canGenerateRequestsLink).toBe(false)
    expect(wrapper2.vm.exploreLinkKebabMenu).toBe('')
    expect(wrapper2.vm.requestsLinkKebabMenu).toBe('')

  })
})

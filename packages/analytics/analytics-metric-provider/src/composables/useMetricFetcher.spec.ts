import { vi, describe, expect } from 'vitest'
import useMetricFetcher from './useMetricFetcher'
import { DEFAULT_KEY } from '../constants'
import { ref } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { MetricFetcherOptions } from '../types'
import composables from '.'
import { addDays } from '../mockExploreResponse'

const CHART_REFRESH_INTERVAL_MS = 30 * 1000

const timeRange = {
  start: addDays(new Date(), -1),
  end: new Date(),
}

const deltaStart = addDays(timeRange.start, -1)

const EXPLORE_RESULT_TREND: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: deltaStart.toISOString(),
      event: {
        request_count: 10,
      },
    },
    {
      version: 'v1',
      timestamp: timeRange.start.toISOString(),
      event: {
        request_count: 20,
      },
    },
  ],
  meta: {
    start: deltaStart.toISOString(),
    end: timeRange.end.toISOString(),
    granularity_ms: 86400000,
    query_id: '',
    metric_names: [
      'request_count',
    ],
    metric_units: {
      request_count: 'count',
    },
    display: {},
  },
}

const EXPLORE_RESULT_NO_TREND: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: timeRange.start.toISOString(),
      event: {
        request_count: 20,
      },
    },
  ],
  meta: {
    start: timeRange.start.toISOString(),
    end: timeRange.end.toISOString(),
    granularity_ms: 86400000,
    query_id: '',
    metric_names: [
      'request_count',
    ],
    metric_units: {
      request_count: 'count',
    },
    display: {},
  },
}

const EXPLORE_RESULT_NO_RECORDS: ExploreResultV4 = {
  data: [],
  meta: {
    start: deltaStart.toISOString(),
    end: timeRange.start.toISOString(),
    granularity_ms: 86400000,
    query_id: '',
    metric_names: [
      'request_count',
    ],
    metric_units: {
      request_count: 'count',
    },
    display: {},
  },
}

describe('useMetricFetcher', () => {

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('can get metric data with trend', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: ref([
        'request_count',
      ]),
      timeRange: ref({
        type: 'relative',
        time_range: '24h',
      }),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    } as any

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_TREND), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptions)

    expect(composables.useRequest).toBeCalledTimes(1)

    const expected = {
      current: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 10,
        },
      },
    }
    expect(trafficData.mapped.value).toEqual(expected)
  })

  it('handles empty result', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: ref([
        'request_count',
      ]),
      timeRange: ref({
        type: 'relative',
        time_range: '24h',
      }),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    } as any

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref({}), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptions)

    expect(composables.useRequest).toBeCalledTimes(1)

    const expected = {
      current: {},
      previous: {},
    }

    expect(trafficData.mapped.value).toEqual(expected)

    expect(trafficData.raw.value).toEqual({})
  })

  it('handles no records and no trend', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: ref([
        'request_count',
      ]),
      timeRange: ref({
        type: 'relative',
        time_range: '24h',
      }),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    } as any

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_NO_RECORDS), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptions)

    expect(composables.useRequest).toBeCalledTimes(1)

    const expected = {
      current: {},
      previous: {},
    }

    expect(trafficData.mapped.value).toEqual(expected)
  })

  it('handles no records, no trend, and no dimensions', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: ref([
        'request_count',
      ]),
      timeRange: ref({
        type: 'relative',
        time_range: '24h',
      }),
      withTrend: ref(false),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    } as any

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_NO_RECORDS), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptions)

    expect(composables.useRequest).toBeCalledTimes(1)

    const expected = {
      current: {},
      previous: {},
    }

    expect(trafficData.mapped.value).toEqual(expected)
  })

  it('properly calculates descriptions for custom timeperiods with trend', () => {
    const fetcherOptionsTrend: MetricFetcherOptions = {
      metrics: ref([
        'request_count',
      ]),
      timeRange: ref({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      }),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    } as any

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_TREND), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptionsTrend)

    expect(composables.useRequest).toBeCalledTimes(1)

    expect(trafficData.trendRange.value).toEqual('vs previous day')
  })

  it('properly calculates descriptions for custom timeperiods without trend', () => {
    const fetcherOptionsTrend: MetricFetcherOptions = {
      metrics: ref([
        'request_count',
      ]),
      timeRange: ref({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      }),
      withTrend: ref(false),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    } as any

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_NO_TREND), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptionsTrend)

    expect(composables.useRequest).toBeCalledTimes(1)

    expect(trafficData.trendRange.value).toEqual('vs previous day')
  })

})

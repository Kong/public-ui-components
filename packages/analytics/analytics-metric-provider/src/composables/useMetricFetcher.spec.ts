import { vi, describe, expect } from 'vitest'
import useMetricFetcher, { buildDeltaMapping, DEFAULT_KEY } from './useMetricFetcher'
import { ref } from 'vue'
import type { ExploreResultV4,
  Timeframe } from '@kong-ui-public/analytics-utilities'
import {
  DeltaQueryTime,
  TimeframeKeys,
  TimePeriods,
  UnaryQueryTime,
} from '@kong-ui-public/analytics-utilities'
import type { MetricFetcherOptions } from '../types'
import composables from '.'

// Stub `addDays` from `date-fns` here to avoid a dependency just for unit testing.
const addDays = (date: Date, amount: number) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + amount)
  return newDate
}

const CHART_REFRESH_INTERVAL_MS = 30 * 1000

const timeRange = {
  start: new Date(new Date().getTime() - (24 * 60 * 60 * 1000)), // 1 day ago
  end: new Date(),
}
const deltaQueryTime = new DeltaQueryTime(timeRange, 'hourly')
const unaryQueryTime = new UnaryQueryTime(timeRange, 'hourly')

const EXPLORE_RESULT_TREND: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        request_count: 10,
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        request_count: 20,
      },
    },
  ],
  meta: {
    start_ms: deltaQueryTime.startMs(),
    end_ms: deltaQueryTime.endMs(),
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
      timestamp: unaryQueryTime.startDate().toISOString(),
      event: {
        request_count: 20,
      },
    },
  ],
  meta: {
    start_ms: unaryQueryTime.startMs(),
    end_ms: unaryQueryTime.endMs(),
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

const EXPLORE_RESULT_PREVIOUS_DATA_ONLY: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        request_count: 10,
      },
    },
  ],
  meta: {
    start_ms: deltaQueryTime.startMs(),
    end_ms: deltaQueryTime.endMs(),
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

const EXPLORE_RESULT_CURRENT_DATA_ONLY: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        request_count: 20,
      },
    },
  ],
  meta: {
    start_ms: deltaQueryTime.startMs(),
    end_ms: deltaQueryTime.endMs(),
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
    start_ms: deltaQueryTime.startMs(),
    end_ms: deltaQueryTime.endMs(),
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

const EXPLORE_RESULT_CURRENT_DATA_MULTI_DIMENSION: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        route: 'route1',
        request_count: 20,
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        route: 'route1',
        request_count: 10,
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        route: 'route2',
        request_count: 20,
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        route: 'route2',
        request_count: 10,
        status_code_grouped: '5XX',
      },
    },
  ],
  meta: {
    start_ms: deltaQueryTime.startMs(),
    end_ms: deltaQueryTime.endMs(),
    granularity_ms: 86400000,
    query_id: '',
    metric_names: [
      'request_count',
    ],
    metric_units: {
      request_count: 'count',
    },
    display: {
      status_code_grouped: {
        '2XX': { name: '2XX' }, '5XX': { name: '5XX' },
      },
      route: {
        route1: { name: 'route1' },
        route2: { name: 'route2' },
      },
    },
  },
}

const EXPLORE_RESULT_TREND_DATA_MULTI_DIMENSION: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        request_count: 20,
        route: 'route1',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        request_count: 10,
        route: 'route1',
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        request_count: 25,
        route: 'route2',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        request_count: 15,
        route: 'route2',
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        request_count: 40,
        route: 'route1',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        request_count: 20,
        route: 'route1',
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        request_count: 45,
        route: 'route2',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        request_count: 25,
        route: 'route2',
        status_code_grouped: '5XX',
      },
    },
  ],
  meta: {
    start_ms: deltaQueryTime.startMs(),
    end_ms: deltaQueryTime.endMs(),
    granularity_ms: 86400000,
    query_id: '',
    metric_names: [
      'request_count',
    ],
    metric_units: {
      request_count: 'count',
    },
    display: {
      route: {
        route1: { name: 'route1' }, route2: { name: 'route2' },
      },
      status_code_grouped: {
        '2XX': { name: '2XX' }, '5XX': { name: '5XX' },
      },
    },
  },
}

describe('useMetricFetcher', () => {

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('can get metric data with trend', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: [
        'request_count',
      ],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    }

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
      metrics: [
        'request_count',
      ],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    }

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
      metrics: [
        'request_count',
      ],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    }

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
      metrics: [
        'request_count',
      ],
      filterValues: ['test-org-uuid'],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: ref(false),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    }

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
      metrics: [
        'request_count',
      ],
      filterValues: ['test-org-uuid'],
      timeRange: ref({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      }),
      loading: ref(true),
      hasError: ref(false),
      withTrend: ref(true),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    }

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_TREND), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptionsTrend)

    expect(composables.useRequest).toBeCalledTimes(1)

    expect(trafficData.trendRange.value).toEqual('vs previous day')
  })

  it('properly calculates descriptions for custom timeperiods without trend', () => {
    const fetcherOptionsTrend: MetricFetcherOptions = {
      metrics: [
        'request_count',
      ],
      filterValues: ['test-org-uuid'],
      timeRange: ref({
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-02T00:00:00Z'),
      }),
      loading: ref(true),
      hasError: ref(false),
      withTrend: ref(false),
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
    }

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref(EXPLORE_RESULT_NO_TREND), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptionsTrend)

    expect(composables.useRequest).toBeCalledTimes(1)

    expect(trafficData.trendRange.value).toEqual('vs previous day')
  })

})

describe('buildDeltaMapping', () => {
  it('can get metric data without trend', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_NO_TREND, false)

    const expected = {
      current: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('can get metric data when there is only previous data', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_PREVIOUS_DATA_ONLY, true)

    const expected = {
      current: {},
      previous: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 10,
        },
      },
    }
    expect(trafficData).toEqual(expected)
  })

  it('can get metric data when there is only current data', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_ONLY, true)

    const expected = {
      current: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('handles current record only, trend, and no dimensions', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_ONLY, true)

    const expected = {
      current: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('handles current record only, no trend', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_ONLY, true)

    const expected = {
      current: {
        [DEFAULT_KEY]: {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }
    expect(trafficData).toEqual(expected)
  })

  it('can get metric data when there is only current data for multi-dimensional result', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_MULTI_DIMENSION, true)

    const expected = {
      current: {
        route1: {
          '2XX': 20,
          '5XX': 10,
        },
        route2: {
          '2XX': 20,
          '5XX': 10,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('can get metric data with trend for multi-dimensional result', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_TREND_DATA_MULTI_DIMENSION, true)

    const expected = {
      current: {
        route1: {
          '2XX': 40,
          '5XX': 20,
        },
        route2: {
          '2XX': 45,
          '5XX': 25,
        },
      },
      previous: {
        route1: {
          '2XX': 20,
          '5XX': 10,
        },
        route2: {
          '2XX': 25,
          '5XX': 15,
        },
      },
    }

    expect(trafficData).toEqual(expected)
  })
})

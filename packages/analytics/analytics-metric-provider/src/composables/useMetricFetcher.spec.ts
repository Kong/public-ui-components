import { vi, describe, expect } from 'vitest'
import useMetricFetcher, { buildDeltaMapping, DEFAULT_KEY } from './useMetricFetcher'
import { ref } from 'vue'
import { DeltaQueryTime, TimeframeKeys, TimePeriods, UnaryQueryTime, Timeframe } from '@kong-ui-public/analytics-utilities'
import { DataFetcher, EXPLORE_V2_AGGREGATIONS, EXPLORE_V2_DIMENSIONS, MetricFetcherOptions } from 'src/types'
import composables from '.'

// Stub `addDays` from `date-fns` here to avoid a dependency just for unit testing.
const addDays = (date: Date, amount: number) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + amount)
  return newDate
}

const CHART_REFRESH_INTERVAL_MS = 30 * 1000

const timePeriod = TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe
const deltaQueryTime = new DeltaQueryTime(timePeriod)
const unaryQueryTime = new UnaryQueryTime(timePeriod)

const EXPLORE_RESULT_TREND = {
  records: [
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        ORGANIZATION: 'test-org-uuid',
        REQUEST_COUNT: 10,
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        ORGANIZATION: 'test-org-uuid',
        REQUEST_COUNT: 20,
      },
    },
  ],
  meta: {
    startMs: deltaQueryTime.startMs(),
    endMs: deltaQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {
      ORGANIZATION: [
        'test-org-uuid',
      ],
    },
  },
}

const EXPLORE_RESULT_NO_TREND = {
  records: [
    {
      version: 'v1',
      timestamp: unaryQueryTime.startDate().toISOString(),
      event: {
        ORGANIZATION: 'test-org-uuid',
        REQUEST_COUNT: 20,
      },
    },
  ],
  meta: {
    startMs: unaryQueryTime.startMs(),
    endMs: unaryQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {
      ORGANIZATION: [
        'test-org-uuid',
      ],
    },
  },
}

const EXPLORE_RESULT_PREVIOUS_DATA_ONLY = {
  records: [
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        ORGANIZATION: 'test-org-uuid',
        REQUEST_COUNT: 10,
      },
    },
  ],
  meta: {
    startMs: deltaQueryTime.startMs(),
    endMs: deltaQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {
      ORGANIZATION: [
        'test-org-uuid',
      ],
    },
  },
}

const EXPLORE_RESULT_CURRENT_DATA_ONLY = {
  records: [
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        ORGANIZATION: 'test-org-uuid',
        REQUEST_COUNT: 20,
      },
    },
  ],
  meta: {
    startMs: deltaQueryTime.startMs(),
    endMs: deltaQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {
      ORGANIZATION: [
        'test-org-uuid',
      ],
    },
  },
}

const EXPLORE_RESULT_NO_RECORDS = {
  records: [],
  meta: {
    startMs: deltaQueryTime.startMs(),
    endMs: deltaQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {},
  },
}

const EXPLORE_RESULT_CURRENT_DATA_MULTI_DIMENSION = {
  records: [
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        ROUTE: 'route1',
        REQUEST_COUNT: 20,
        STATUS_CODE_GROUPED: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        ROUTE: 'route1',
        REQUEST_COUNT: 10,
        STATUS_CODE_GROUPED: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        ROUTE: 'route2',
        REQUEST_COUNT: 20,
        STATUS_CODE_GROUPED: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        ROUTE: 'route2',
        REQUEST_COUNT: 10,
        STATUS_CODE_GROUPED: '5XX',
      },
    },
  ],
  meta: {
    startMs: deltaQueryTime.startMs(),
    endMs: deltaQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {
      STATUS_CODE_GROUPED: [
        '2XX', '5XX',
      ],
      ROUTE: [
        'route1',
        'route2',
      ],
    },
  },
}

const EXPLORE_RESULT_TREND_DATA_MULTI_DIMENSION = {
  records: [
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        REQUEST_COUNT: 20,
        ROUTE: 'route1',
        STATUS_CODE_GROUPED: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        REQUEST_COUNT: 10,
        ROUTE: 'route1',
        STATUS_CODE_GROUPED: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        REQUEST_COUNT: 25,
        ROUTE: 'route2',
        STATUS_CODE_GROUPED: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaQueryTime.startDate().toISOString(),
      event: {
        REQUEST_COUNT: 15,
        ROUTE: 'route2',
        STATUS_CODE_GROUPED: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        REQUEST_COUNT: 40,
        ROUTE: 'route1',
        STATUS_CODE_GROUPED: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        REQUEST_COUNT: 20,
        ROUTE: 'route1',
        STATUS_CODE_GROUPED: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        REQUEST_COUNT: 45,
        ROUTE: 'route2',
        STATUS_CODE_GROUPED: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaQueryTime.startDate(), 1).toISOString(),
      event: {
        REQUEST_COUNT: 25,
        ROUTE: 'route2',
        STATUS_CODE_GROUPED: '5XX',
      },
    },
  ],
  meta: {
    startMs: deltaQueryTime.startMs(),
    endMs: deltaQueryTime.endMs(),
    granularity: 86400000,
    queryId: '',
    metricNames: [
      'REQUEST_COUNT',
    ],
    metricUnits: {
      REQUEST_COUNT: 'count',
    },
    dimensions: {
      ROUTE: [
        'route1', 'route2',
      ],
      STATUS_CODE_GROUPED: [
        '2XX', '5XX',
      ],
    },
  },
}

const dataFetcher: DataFetcher =
  () => { throw new Error('Should never reach here -- mock failed?') }

describe('useMetricFetcher', () => {

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('can get metric data with trend', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: [
        EXPLORE_V2_AGGREGATIONS.REQUEST_COUNT,
      ],
      dimensions: [EXPLORE_V2_DIMENSIONS.ORGANIZATION],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: true,
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
      dataFetcher,
    }

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref({ data: EXPLORE_RESULT_TREND }), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptions)

    expect(composables.useRequest).toBeCalledTimes(1)

    const expected = {
      current: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 10,
        },
      },
    }
    expect(trafficData.mapped.value).toEqual(expected)
  })

  it('handles empty result', () => {

    const fetcherOptions: MetricFetcherOptions = {
      metrics: [
        EXPLORE_V2_AGGREGATIONS.REQUEST_COUNT,
      ],
      dimensions: [EXPLORE_V2_DIMENSIONS.ORGANIZATION],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: true,
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
      dataFetcher,
    }

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref({ data: undefined }), error: {}, isValidating: ref(false) })

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
        EXPLORE_V2_AGGREGATIONS.REQUEST_COUNT,
      ],
      dimensions: [EXPLORE_V2_DIMENSIONS.ORGANIZATION],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: true,
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
      dataFetcher,
    }

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref({ data: EXPLORE_RESULT_NO_RECORDS }), error: {}, isValidating: ref(false) })

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
        EXPLORE_V2_AGGREGATIONS.REQUEST_COUNT,
      ],
      filterValues: ['test-org-uuid'],
      timeframe: ref(TimePeriods.get(TimeframeKeys.ONE_DAY) as Timeframe),
      loading: ref(true),
      hasError: ref(false),
      withTrend: false,
      refreshInterval: CHART_REFRESH_INTERVAL_MS,
      dataFetcher,
    }

    // @ts-ignore
    vi.spyOn(composables, 'useRequest').mockReturnValue({ response: ref({ data: EXPLORE_RESULT_NO_RECORDS }), error: {}, isValidating: ref(false) })

    const trafficData = useMetricFetcher(fetcherOptions)

    expect(composables.useRequest).toBeCalledTimes(1)

    const expected = {
      current: {},
      previous: {},
    }

    expect(trafficData.mapped.value).toEqual(expected)
  })

})

describe('buildDeltaMapping', () => {
  it('can get metric data without trend', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_NO_TREND, unaryQueryTime, false)

    const expected = {
      current: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('can get metric data when there is only previous data', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_PREVIOUS_DATA_ONLY, deltaQueryTime, true)

    const expected = {
      current: {},
      previous: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 10,
        },
      },
    }
    expect(trafficData).toEqual(expected)
  })

  it('can get metric data when there is only current data', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_ONLY, deltaQueryTime, true)

    const expected = {
      current: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('handles current record only, trend, and no dimensions', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_ONLY, deltaQueryTime, true)

    const expected = {
      current: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }

    expect(trafficData).toEqual(expected)
  })

  it('handles current record only, no trend', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_ONLY, deltaQueryTime, true)

    const expected = {
      current: {
        'test-org-uuid': {
          [DEFAULT_KEY]: 20,
        },
      },
      previous: {},
    }
    expect(trafficData).toEqual(expected)
  })

  it('can get metric data when there is only current data for multi-dimensional result', () => {
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_CURRENT_DATA_MULTI_DIMENSION, deltaQueryTime, true)

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
    const trafficData = buildDeltaMapping(EXPLORE_RESULT_TREND_DATA_MULTI_DIMENSION, deltaQueryTime, true)

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

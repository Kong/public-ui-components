import { describe, expect } from 'vitest'
import { buildDeltaMapping } from './trend-display'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { addDays } from '../mockExploreResponse'
import { DEFAULT_KEY } from '../constants'

const timeRange = {
  start: addDays(new Date(), -1),
  end: new Date(),
}

const deltaStart = addDays(timeRange.start, -1)

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

const EXPLORE_RESULT_PREVIOUS_DATA_ONLY: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: deltaStart.toISOString(),
      event: {
        request_count: 10,
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

const EXPLORE_RESULT_CURRENT_DATA_ONLY: ExploreResultV4 = {
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

const EXPLORE_RESULT_CURRENT_DATA_MULTI_DIMENSION: ExploreResultV4 = {
  data: [
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        route: 'route1',
        request_count: 20,
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        route: 'route1',
        request_count: 10,
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        route: 'route2',
        request_count: 20,
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        route: 'route2',
        request_count: 10,
        status_code_grouped: '5XX',
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
      timestamp: deltaStart.toISOString(),
      event: {
        request_count: 20,
        route: 'route1',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaStart.toISOString(),
      event: {
        request_count: 10,
        route: 'route1',
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaStart.toISOString(),
      event: {
        request_count: 25,
        route: 'route2',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: deltaStart.toISOString(),
      event: {
        request_count: 15,
        route: 'route2',
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        request_count: 40,
        route: 'route1',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        request_count: 20,
        route: 'route1',
        status_code_grouped: '5XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        request_count: 45,
        route: 'route2',
        status_code_grouped: '2XX',
      },
    },
    {
      version: 'v1',
      timestamp: addDays(deltaStart, 1).toISOString(),
      event: {
        request_count: 25,
        route: 'route2',
        status_code_grouped: '5XX',
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

    console.log(trafficData)

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


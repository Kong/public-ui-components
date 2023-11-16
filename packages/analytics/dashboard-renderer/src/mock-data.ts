export const exploreV3Response = {
  meta: {
    startMs: 1694754000000,
    endMs: 1699938000000,
    granularity: 2592000000,
    queryId: 'f928cab7-7ad0-46b2-b6ee-9b10e66b12d7',
    metricNames: ['REQUEST_COUNT'],
    truncated: false,
    limit: 50,
    metricUnits: { REQUEST_COUNT: 'count' },
    dimensions: { STATUS_CODE_GROUPED: ['2XX', '3XX', '4XX', '5XX'] },
  },
  records: [{
    event: { STATUS_CODE_GROUPED: '2XX', REQUEST_COUNT: 70478566 },
    timestamp: '2023-09-15T05:00:00.000Z',
  }, {
    event: { STATUS_CODE_GROUPED: '3XX', REQUEST_COUNT: 22331607 },
    timestamp: '2023-09-15T05:00:00.000Z',
  }, {
    event: { STATUS_CODE_GROUPED: '4XX', REQUEST_COUNT: 18810856 },
    timestamp: '2023-09-15T05:00:00.000Z',
  }, {
    event: { STATUS_CODE_GROUPED: '5XX', REQUEST_COUNT: 18416309 },
    timestamp: '2023-09-15T05:00:00.000Z',
  }, {
    event: { STATUS_CODE_GROUPED: '2XX', REQUEST_COUNT: 66163090 },
    timestamp: '2023-10-15T05:00:00.000Z',
  }, {
    event: { STATUS_CODE_GROUPED: '3XX', REQUEST_COUNT: 20914198 },
    timestamp: '2023-10-15T05:00:00.000Z',
  }, {
    event: { STATUS_CODE_GROUPED: '4XX', REQUEST_COUNT: 18208131 },
    timestamp: '2023-10-15T05:00:00.000Z',
  }, { event: { STATUS_CODE_GROUPED: '5XX', REQUEST_COUNT: 17275256 }, timestamp: '2023-10-15T05:00:00.000Z' }],
}

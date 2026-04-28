import { afterEach, describe, expect, it, vi } from 'vitest'

import { generateCrossSectionalData, generateData } from './chartDataGenerator'

describe('chartDataGenerator', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('generates cross-sectional data for each dimension combination with the default value range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = generateCrossSectionalData(
      [{ name: 'totalRequests', unit: 'count' }],
      {
        status_code: ['2xx', '5xx'],
        route: ['/payments', '/orders'],
      },
    )

    expect(result.data).toHaveLength(4)
    expect(result.data).toEqual([
      expect.objectContaining({
        timestamp: '2026-04-20T12:00:00.000Z',
        event: expect.objectContaining({ status_code: '2xx', route: '/payments' }),
      }),
      expect.objectContaining({
        timestamp: '2026-04-20T12:00:00.000Z',
        event: expect.objectContaining({ status_code: '2xx', route: '/orders' }),
      }),
      expect.objectContaining({
        timestamp: '2026-04-20T12:00:00.000Z',
        event: expect.objectContaining({ status_code: '5xx', route: '/payments' }),
      }),
      expect.objectContaining({
        timestamp: '2026-04-20T12:00:00.000Z',
        event: expect.objectContaining({ status_code: '5xx', route: '/orders' }),
      }),
    ])

    result.data.forEach(record => {
      expect(record.event.totalRequests).toBeGreaterThanOrEqual(50)
      expect(record.event.totalRequests).toBeLessThanOrEqual(500)
    })

    expect(result.meta).toMatchObject({
      metric_names: ['totalRequests'],
      metric_units: { totalRequests: 'count' },
      limit: 50,
      display: {
        status_code: {
          '2xx': { name: '2xx', deleted: false },
          '5xx': { name: '5xx', deleted: false },
        },
        route: {
          '/payments': { name: '/payments', deleted: false },
          '/orders': { name: '/orders', deleted: false },
        },
      },
    })
  })

  it('uses cross-sectional data by default', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = generateData({
      metrics: [{ name: 'totalRequests', unit: 'count' }],
      dimensionMap: { status_code: ['2xx', '5xx'] },
      metaOverrides: { query_id: 'cross-sectional' },
      valueRange: [10, 20],
    })

    expect(result.data).toHaveLength(2)
    result.data.forEach(record => {
      expect(record.timestamp).toBe('2026-04-20T12:00:00.000Z')
      expect(record.event.totalRequests).toBeGreaterThanOrEqual(10)
      expect(record.event.totalRequests).toBeLessThanOrEqual(20)
      expect(record.event.status_code).toMatch(/2xx|5xx/)
    })

    expect(result.meta).toMatchObject({
      query_id: 'cross-sectional',
      limit: 50,
      granularity_ms: 6 * 60 * 60 * 1000,
      metric_names: ['totalRequests'],
    })
  })

  it('uses single-metric time series data when timeSeries is enabled for one metric', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'))

    const result = generateData({
      metrics: [{ name: 'totalRequests', unit: 'count' }],
      dimensionMap: { status_code: ['2xx', '5xx'] },
      metaOverrides: { query_id: 'single-metric-timeseries' },
      valueRange: [10, 20],
      timeSeries: true,
    })

    expect(result.data).toHaveLength(14)
    expect(result.meta).toMatchObject({
      query_id: 'single-metric-timeseries',
      granularity_ms: 60 * 60 * 1000,
      metric_names: ['totalRequests'],
    })

    const timestamps = new Set(result.data.map(record => record.timestamp))
    expect(timestamps.size).toBe(7)
    result.data.forEach(record => {
      expect(record.event.totalRequests).toBeTypeOf('number')
      expect(record.event.status_code).toMatch(/2xx|5xx/)
    })
  })

  it('uses multiple-metric time series data when timeSeries is enabled for more than one metric', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'))

    const result = generateData({
      metrics: [
        { name: 'totalRequests', unit: 'count' },
        { name: 'latency', unit: 'ms' },
      ],
      dimensionMap: { status_code: ['2xx', '5xx'] },
      metaOverrides: { query_id: 'multiple-metric-timeseries' },
      valueRange: [10, 20],
      timeSeries: true,
    })

    expect(result.data).toHaveLength(7)
    expect(result.meta).toMatchObject({
      query_id: 'multiple-metric-timeseries',
      granularity_ms: 60 * 60 * 1000,
      metric_names: ['totalRequests', 'latency'],
      display: {},
    })

    result.data.forEach(record => {
      expect(record.event.totalRequests).toBeTypeOf('number')
      expect(record.event.latency).toBeTypeOf('number')
      expect(record.event).not.toHaveProperty('status_code')
    })
  })

  it('respects a larger valueRange when generating cross-sectional data', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const result = generateData({
      metrics: [{ name: 'totalRequests', unit: 'count' }],
      dimensionMap: { status_code: ['2xx', '5xx'] },
      valueRange: [500, 1000],
    })

    expect(result.data).toHaveLength(2)
    result.data.forEach(record => {
      expect(record.event.totalRequests).toBeGreaterThanOrEqual(500)
      expect(record.event.totalRequests).toBeLessThanOrEqual(1000)
    })
  })
})

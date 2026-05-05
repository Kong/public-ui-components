import { generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  KUI_STATUS_COLOR_200,
  KUI_STATUS_COLOR_200S,
  KUI_STATUS_COLOR_400S,
  KUI_STATUS_COLOR_500,
} from '@kong/design-tokens'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import useTimeseriesChartData from './useTimeseriesChartData'

const createExploreResult = ({
  display,
  metricNames = ['request_count'],
  records,
  granularityMs = 60 * 60 * 1000,
}: {
  display?: ExploreResultV4['meta']['display']
  metricNames?: string[]
  records: Array<{
    timestamp: string
    event: Record<string, string | number>
  }>
  granularityMs?: number
}): ExploreResultV4 => {
  return {
    meta: {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-01T03:00:00.000Z',
      granularity_ms: granularityMs,
      metric_names: metricNames,
      metric_units: Object.fromEntries(metricNames.map(metric => [metric, 'count'])),
      ...(display ? { display } : {}),
    },
    data: records,
  } as ExploreResultV4
}

describe('useTimeseriesChartData', () => {
  it('builds time-series datasets from explore data', () => {
    const exploreResult = generateSingleMetricTimeSeriesData(
      { name: 'request_count', unit: 'count' },
      { status_code: ['200', '500'] },
    )

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets).toHaveLength(2)
    expect(chartData.value.datasets[0]?.label).toBe('200')
    expect(chartData.value.datasets[0]?.data.length).toBeGreaterThan(0)
    expect(chartData.value.datasets[0]?.data[0]).toEqual(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }))
    expect(chartData.value.datasets[0]?.total).toEqual(expect.any(Number))
  })

  it('returns empty chart data for invalid granularity', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exploreResult = createExploreResult({
      granularityMs: 0,
      records: [{
        timestamp: '2024-01-01T00:00:00.000Z',
        event: {
          request_count: 10,
        },
      }],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value).toEqual({ datasets: [], labels: [] })

    consoleErrorSpy.mockRestore()
  })

  it('builds a metric dataset when no display dimensions are provided', () => {
    const exploreResult = createExploreResult({
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            request_count: 5,
          },
        },
        {
          timestamp: '2024-01-01T01:00:00.000Z',
          event: {
            request_count: 7,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets).toHaveLength(1)
    expect(chartData.value.datasets[0]).toEqual(expect.objectContaining({
      label: 'Request count',
      rawDimension: 'request_count',
      rawMetric: 'request_count',
      total: 12,
    }))
  })

  it('builds one dataset per metric for multi-metric data', () => {
    const exploreResult = createExploreResult({
      metricNames: ['request_count', 'response_latency_average'],
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            request_count: 5,
            response_latency_average: 100,
          },
        },
        {
          timestamp: '2024-01-01T01:00:00.000Z',
          event: {
            request_count: 7,
            response_latency_average: 200,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets.map(({ label }) => label)).toEqual([
      'Request count',
      'Response latency (avg)',
    ])
  })

  it('uses country names for country-code dimensions', () => {
    const exploreResult = createExploreResult({
      display: {
        country_code: {
          US: { name: 'US' },
          CA: { name: 'CA' },
        },
      },
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            country_code: 'US',
            request_count: 5,
          },
        },
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            country_code: 'CA',
            request_count: 7,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets.map(({ label }) => label)).toEqual([
      'United States',
      'Canada',
    ])
  })

  it('zero-fills missing timestamp buckets', () => {
    const exploreResult = createExploreResult({
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            request_count: 5,
          },
        },
        {
          timestamp: '2024-01-01T02:00:00.000Z',
          event: {
            request_count: 7,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets[0]?.data).toEqual([
      { x: Date.parse('2024-01-01T00:00:00.000Z'), y: 5 },
      { x: Date.parse('2024-01-01T01:00:00.000Z'), y: 0 },
      { x: Date.parse('2024-01-01T02:00:00.000Z'), y: 7 },
    ])
  })

  it('uses status-code colors by default for status code dimensions', () => {
    const exploreResult = createExploreResult({
      display: {
        status_code: {
          200: { name: '200' },
          500: { name: '500' },
        },
      },
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            status_code: '200',
            request_count: 5,
          },
        },
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            status_code: '500',
            request_count: 7,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets.map(({ backgroundColor }) => backgroundColor)).toEqual([
      KUI_STATUS_COLOR_200,
      KUI_STATUS_COLOR_500,
    ])
  })

  it('uses status-code group colors by default for grouped status code dimensions', () => {
    const exploreResult = createExploreResult({
      display: {
        status_code_grouped: {
          '2XX': { name: '2XX' },
          '4XX': { name: '4XX' },
        },
      },
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            status_code_grouped: '2XX',
            request_count: 5,
          },
        },
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            status_code_grouped: '4XX',
            request_count: 7,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets.map(({ backgroundColor }) => backgroundColor)).toEqual([
      KUI_STATUS_COLOR_200S,
      KUI_STATUS_COLOR_400S,
    ])
  })

  it('keeps caller-provided colors ahead of status-code defaults', () => {
    const exploreResult = createExploreResult({
      display: {
        status_code: {
          200: { name: '200' },
        },
      },
      records: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          event: {
            status_code: '200',
            request_count: 5,
          },
        },
      ],
    })

    const chartData = useTimeseriesChartData({
      colorPalette: {
        200: '#123456',
      },
    }, ref(exploreResult))

    expect(chartData.value.datasets[0]?.backgroundColor).toBe('#123456')
  })
})

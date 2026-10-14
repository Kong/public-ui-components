import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { Granularities } from '@kong-ui-public/analytics-utilities'
import { describe, expect, it, vi } from 'vitest'
import { exploreResultToHeatmap } from './heatmap-adapters'

const TZ = 'UTC'

const buildResult = ({
  start,
  end,
  granularityMs,
  records,
}: {
  start: string
  end: string
  granularityMs: number
  records: Array<[timestamp: string, route: string, requests: number]>
}): ExploreResultV4 => ({
  data: records.map(([timestamp, route, request_count]) => ({ timestamp, event: { route, request_count } })),
  meta: {
    start,
    end,
    granularity_ms: granularityMs,
    query_id: 'query',
    metric_names: ['request_count'],
    display: {
      route: { a: { name: 'Route A' }, b: { name: 'Route B' } },
    },
  },
})

describe('exploreResultToHeatmap', () => {
  it('builds a column per day for daily granularity', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-01T00:00:00Z',
      end: '2026-01-04T00:00:00Z',
      granularityMs: Granularities.daily,
      records: [
        ['2026-01-01T00:00:00Z', 'a', 1],
        ['2026-01-03T00:00:00Z', 'b', 3],
      ],
    }), { tz: TZ })

    expect(heatmap).toEqual({
      data: [[0, 0, 1], [2, 1, 3]],
      xAxisLabels: ['Jan 01', 'Jan 02', 'Jan 03'],
      yAxisLabels: ['Route A', 'Route B'],
    })
  })

  it('builds a column per hour for hourly granularity within one day', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-01T10:00:00Z',
      end: '2026-01-01T13:00:00Z',
      granularityMs: Granularities.hourly,
      records: [
        ['2026-01-01T10:00:00Z', 'a', 1],
        ['2026-01-01T12:00:00Z', 'a', 2],
      ],
    }), { tz: TZ })

    expect(heatmap?.xAxisLabels).toEqual(['10:00 AM', '11:00 AM', '12:00 PM'])
    expect(heatmap?.data).toEqual([[0, 0, 1], [2, 0, 2]])
  })

  it('includes the date in hourly labels when the range spans days', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-01T23:00:00Z',
      end: '2026-01-02T01:00:00Z',
      granularityMs: Granularities.hourly,
      records: [['2026-01-02T00:00:00Z', 'a', 1]],
    }), { tz: TZ })

    expect(heatmap?.xAxisLabels).toEqual(['Jan 01, 11:00 PM', 'Jan 02, 12:00 AM'])
    expect(heatmap?.data).toEqual([[1, 0, 1]])
  })

  it('labels weekly columns by ISO week', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-05T00:00:00Z',
      end: '2026-01-19T00:00:00Z',
      granularityMs: Granularities.weekly,
      records: [['2026-01-12T00:00:00Z', 'a', 1]],
    }), { tz: TZ })

    expect(heatmap?.xAxisLabels).toEqual(['2026 W02', '2026 W03'])
    expect(heatmap?.data).toEqual([[1, 0, 1]])
  })

  it('formats labels in the given timezone', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-01T10:00:00Z',
      end: '2026-01-01T11:00:00Z',
      granularityMs: Granularities.hourly,
      records: [['2026-01-01T10:00:00Z', 'a', 1]],
    }), { tz: 'America/New_York' })

    expect(heatmap?.xAxisLabels).toEqual(['5:00 AM'])
  })

  it('aligns columns to the records when buckets start before the range start', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-01T10:30:00Z',
      end: '2026-01-01T12:00:00Z',
      granularityMs: Granularities.hourly,
      records: [
        ['2026-01-01T10:00:00Z', 'a', 1],
        ['2026-01-01T11:00:00Z', 'a', 2],
      ],
    }), { tz: TZ })

    expect(heatmap?.xAxisLabels).toEqual(['10:00 AM', '11:00 AM'])
    expect(heatmap?.data).toEqual([[0, 0, 1], [1, 0, 2]])
  })

  it('falls back to daily columns when the result has no granularity', () => {
    const heatmap = exploreResultToHeatmap(buildResult({
      start: '2026-01-01T00:00:00Z',
      end: '2026-01-03T00:00:00Z',
      granularityMs: 0,
      records: [['2026-01-02T00:00:00Z', 'a', 1]],
    }), { tz: TZ })

    expect(heatmap?.xAxisLabels).toEqual(['Jan 01', 'Jan 02'])
    expect(heatmap?.data).toEqual([[1, 0, 1]])
  })

  it('returns undefined without a dimension', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = buildResult({ start: '2026-01-01T00:00:00Z', end: '2026-01-02T00:00:00Z', granularityMs: Granularities.daily, records: [] })
    result.meta.display = {}

    expect(exploreResultToHeatmap(result, { tz: TZ })).toBeUndefined()
    expect(consoleError).toHaveBeenCalled()
  })
})

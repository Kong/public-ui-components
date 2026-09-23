import type { AllAggregations, ExploreResultV4, GroupByResult, MetricUnit } from '@kong-ui-public/analytics-utilities'
import type { TopNColumnOptionsMap } from '../utils/topn-columns'

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'

import useTopTalkersData from './useTopTalkersData'
import { datavisPalette } from '../utils'
import { OTHER_DIMENSION_ID } from '../constants'

const DIMENSION = 'llm_model'

type Row = { id: string, requests: number | null, errorRate?: number | null }

const makeResult = (rows: Row[], units?: MetricUnit): ExploreResultV4 => ({
  data: rows.map((row): GroupByResult => ({
    timestamp: '2026-09-21T00:00:00.000Z',
    event: {
      [DIMENSION]: row.id,
      ai_request_count: row.requests,
      error_rate: row.errorRate ?? null,
    },
  })),
  meta: {
    start: '2026-09-20T00:00:00.000Z',
    end: '2026-09-21T00:00:00.000Z',
    granularity_ms: 86400000,
    query_id: 'test',
    metric_names: ['ai_request_count', 'error_rate'] as AllAggregations[],
    metric_units: units ?? ({ ai_request_count: 'count', error_rate: '%' } as MetricUnit),
    display: {
      [DIMENSION]: Object.fromEntries(rows.map((row) => [
        row.id,
        { name: row.id === OTHER_DIMENSION_ID ? OTHER_DIMENSION_ID : `${row.id} display`, ...(row.id === OTHER_DIMENSION_ID ? { is_other_group: true } : {}) },
      ])),
    },
  },
})

const build = (result: ExploreResultV4 | undefined, options?: TopNColumnOptionsMap, sizeMetric?: string) =>
  useTopTalkersData(ref(result), ref(DIMENSION), ref(sizeMetric), ref(options))

describe('useTopTalkersData', () => {
  it('sizes cells by each row\'s share of the column total', () => {
    const { cells } = build(makeResult([
      { id: 'a', requests: 50 },
      { id: 'b', requests: 30 },
      { id: 'c', requests: 20 },
    ]))

    expect(cells.value.map((cell) => cell.ratio)).toEqual([0.5, 0.3, 0.2])
    expect(cells.value.map((cell) => cell.relative)).toEqual(['50%', '30%', '20%'])
  })

  it('totals the returned rows, so a limited query including OTHER sums to 100%', () => {
    const { column, cells } = build(makeResult([
      { id: 'a', requests: 2 },
      { id: OTHER_DIMENSION_ID, requests: 8 },
    ]))

    expect(column.value.total).toBe('10')
    expect(cells.value.reduce((sum, cell) => sum + cell.ratio, 0)).toBe(1)
  })

  it('pins the OTHER bucket last and flags it', () => {
    const { cells } = build(makeResult([
      { id: 'small', requests: 1 },
      { id: OTHER_DIMENSION_ID, requests: 99 },
      { id: 'big', requests: 50 },
    ]))

    expect(cells.value.map((cell) => cell.id)).toEqual(['big', 'small', OTHER_DIMENSION_ID])
    expect(cells.value.at(-1)?.isOther).toBe(true)
    expect(cells.value.filter((cell) => cell.isOther)).toHaveLength(1)
  })

  it('sorts descending by the size metric', () => {
    const { cells } = build(makeResult([
      { id: 'a', requests: 10 },
      { id: 'b', requests: 40 },
      { id: 'c', requests: 25 },
    ]))

    expect(cells.value.map((cell) => cell.id)).toEqual(['b', 'c', 'a'])
  })

  it('resolves names from the display blob and keeps the raw id for filtering', () => {
    const { cells } = build(makeResult([{ id: 'claude-haiku', requests: 5 }]))

    expect(cells.value[0]).toMatchObject({ id: 'claude-haiku', name: 'claude-haiku display' })
  })

  it('puts every metric except the size metric in the tooltip', () => {
    const { cells } = build(makeResult([{ id: 'a', requests: 10, errorRate: 2.5 }]))

    expect(cells.value[0].tooltipRows).toHaveLength(1)
    expect(cells.value[0].tooltipRows[0]).toMatchObject({ key: 'error_rate', value: '2.5%' })
  })

  it('drops tooltip rows whose metric is null for this dimension', () => {
    const { cells } = build(makeResult([{ id: 'a', requests: 10, errorRate: null }]))

    expect(cells.value[0].tooltipRows).toEqual([])
  })

  it('applies column_options labels and thresholds to tooltip rows', () => {
    const { cells } = build(
      makeResult([{ id: 'a', requests: 10, errorRate: 18.1 }]),
      { error_rate: { label: 'Error rate', thresholds: [{ type: 'error', value: 15 }] } },
    )

    expect(cells.value[0].tooltipRows[0]).toMatchObject({ label: 'Error rate', threshold: 'error' })
  })

  it('honours an explicit size_metric and moves the default one into the tooltip', () => {
    const { sizeKey, cells } = build(
      makeResult([{ id: 'a', requests: 10, errorRate: 4 }]),
      undefined,
      'error_rate',
    )

    expect(sizeKey.value).toBe('error_rate')
    expect(cells.value[0].tooltipRows.map((row) => row.key)).toEqual(['ai_request_count'])
  })

  it('falls back to the first metric when size_metric is not in the response', () => {
    const { sizeKey } = build(makeResult([{ id: 'a', requests: 10 }]), undefined, 'not_a_metric')

    expect(sizeKey.value).toBe('ai_request_count')
  })

  it('renders a non-zero but sub-0.01% share as "< 0.01%" rather than 0%', () => {
    const { cells } = build(makeResult([
      { id: 'tiny', requests: 1 },
      { id: 'huge', requests: 100_000_000 },
    ]))

    expect(cells.value.at(-1)?.relative).toBe('< 0.01%')
  })

  it('flags the `empty` bucket', () => {
    const { cells } = build(makeResult([
      { id: 'a', requests: 10 },
      { id: 'empty', requests: 4 },
    ]))

    expect(cells.value.map((cell) => cell.isEmpty)).toEqual([false, true])
    // `empty` is a real bucket, not the remainder, so it still sorts by value.
    expect(cells.value.map((cell) => cell.isOther)).toEqual([false, false])
  })

  it('returns no cells when the response has no metrics', () => {
    const empty = makeResult([{ id: 'a', requests: 1 }])
    empty.meta.metric_names = []

    expect(build(empty).cells.value).toEqual([])
  })

  it('returns no cells when there is no data at all', () => {
    expect(build(undefined).cells.value).toEqual([])
  })

  it('treats a missing metric value as zero rather than NaN', () => {
    const { cells } = build(makeResult([
      { id: 'a', requests: 10 },
      { id: 'b', requests: null },
    ]))

    expect(cells.value.at(-1)).toMatchObject({ id: 'b', value: 0, ratio: 0 })
  })

  it('paints every cell one datavis hue, ramping the tint by share', () => {
    const { cells } = build(makeResult([
      { id: 'a', requests: 50 },
      { id: 'b', requests: 30 },
      { id: 'c', requests: 20 },
    ]))

    expect(new Set(cells.value.map((cell) => cell.color))).toEqual(new Set([datavisPalette[1]]))

    const tints = cells.value.map((cell) => Number.parseFloat(cell.tint))

    // A half share or more pins to the ceiling; below that the ramp tracks share.
    expect(tints[0]).toBe(85)
    expect(tints[0]).toBeGreaterThan(tints[1])
    expect(tints[1]).toBeGreaterThan(tints[2])
  })
})

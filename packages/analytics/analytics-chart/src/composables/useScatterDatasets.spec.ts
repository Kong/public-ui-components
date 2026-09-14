import type { DisplayBlob, ExploreResultV4, GroupByResult, MetricUnit, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import type { ComputedRef } from 'vue'
import type { ScatterChartData } from '../types'

import { describe, it, expect, afterEach } from 'vitest'
import { computed, ref } from 'vue'

import useScatterDatasets, { jitter } from './useScatterDatasets'
import { exploreResultToScatterData, scatterChartColors } from '../utils'

const START = '2024-06-16T00:00:00.000Z'
const END = '2024-06-16T00:00:10.000Z'

const costRecords = (): GroupByResult[] =>
  Array.from({ length: 10 }, (_, i) => ({
    timestamp: `2024-06-16T00:00:0${i}.000Z`,
    event: { cost: i + 1 },
  }))

const makeResult = (data: GroupByResult[], display: DisplayBlob = {} as DisplayBlob): ComputedRef<ScatterChartData | undefined> =>
  computed(() => exploreResultToScatterData({
    data,
    meta: {
      start: START,
      end: END,
      granularity_ms: 1000,
      display,
      metric_names: ['cost'],
      metric_units: { cost: 'count' } as MetricUnit,
      query_id: '',
    } as unknown as QueryResponseMeta,
  } as ExploreResultV4))

/**
 * Chart.js calls a scriptable option once per point, with the point on `raw`, and once
 * per dataset — to build the legend swatch — with nothing on it.
 */
const resolve = (option: unknown, raw?: unknown): unknown =>
  typeof option === 'function' ? option({ raw }) : option

describe('jitter', () => {
  it('returns 0 when jitter is disabled', () => {
    expect(jitter(0)).toBe(0)
  })

  it('stays within the requested bound', () => {
    for (let i = 0; i < 50; i++) {
      const offset = jitter(100)

      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThan(100)
    }
  })

  it('varies across calls so overlapping points separate', () => {
    const offsets = new Set(Array.from({ length: 50 }, () => jitter(100)))

    expect(offsets.size).toBeGreaterThan(1)
  })
})

describe('useScatterDatasets', () => {
  it('handles missing input', () => {
    expect(useScatterDatasets({}, ref(undefined)).value).toEqual({ datasets: [] })
  })

  it('handles empty records', () => {
    expect(useScatterDatasets({}, makeResult([])).value).toEqual({ datasets: [] })
  })

  it('plots one point per record', () => {
    const { datasets } = useScatterDatasets({}, makeResult(costRecords())).value

    expect(datasets).toHaveLength(1)
    expect(datasets[0].data).toHaveLength(10)
    expect(datasets[0].data[0]).toEqual({ x: new Date('2024-06-16T00:00:00.000Z').valueOf(), y: 1 })
    expect(datasets[0].label).toBe('Costs')
  })

  it('groups points into a dataset per dimension value', () => {
    const data: GroupByResult[] = [
      { timestamp: START, event: { cost: 1, route: 'a' } },
      { timestamp: START, event: { cost: 2, route: 'b' } },
      { timestamp: END, event: { cost: 3, route: 'a' } },
    ]
    const display = { route: { a: { name: 'Route A' }, b: { name: 'Route B' } } } as DisplayBlob
    const { datasets } = useScatterDatasets({}, makeResult(data, display)).value

    expect(datasets.map(d => d.label)).toEqual(['Route A', 'Route B'])
    expect(datasets[0].data).toHaveLength(2)
    expect(datasets[1].data).toHaveLength(1)
  })

  it('labels a group with its raw id when no display name is known', () => {
    const data: GroupByResult[] = [
      { timestamp: START, event: { cost: 1, route: 'cp:route-a' } },
    ]
    const display = { route: {} } as DisplayBlob
    const { datasets } = useScatterDatasets({}, makeResult(data, display)).value

    expect(datasets[0].label).toBe('cp:route-a')
  })

  it('resolves percentile lines without plotting them', () => {
    const { datasets, referenceLines } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50 }, { percentile: 95 }] } },
      makeResult(costRecords()),
    ).value

    // Lines are chart chrome: a dataset of theirs would widen the axes to the query
    // time range and squash the plotted records into whatever width was left.
    expect(datasets).toHaveLength(1)
    expect(datasets[0].type).toBe('scatter')
    expect(referenceLines).toEqual([
      // rank = 0.5 * 9 = 4.5, midway between 5 and 6
      { percentile: 50, label: 'Median', value: 5.5, color: expect.any(String), borderDash: [6, 4] },
      { percentile: 95, label: 'p95', value: expect.any(Number), color: expect.any(String), borderDash: [2, 3] },
    ])
  })

  it('honours a custom label and dash pattern on a line', () => {
    const { referenceLines } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 95, label: 'Ceiling', borderDash: [1, 1] }] } },
      makeResult(costRecords()),
    ).value

    expect(referenceLines![0]).toMatchObject({ label: 'Ceiling', borderDash: [1, 1] })
  })

  it('paints points above the outlier percentile in place', () => {
    const { datasets, outlier } = useScatterDatasets(
      { scatter: { outlierPercentile: 80 } },
      makeResult(costRecords()),
    ).value

    // rank = 0.8 * 9 = 7.2, so 9 and 10 sit above the threshold
    expect(outlier).toEqual({ value: 8.2, label: 'Outlier (> p80)', color: expect.any(String) })

    // Every point stays in the series it belongs to, so the series keeps its legend toggle
    expect(datasets).toHaveLength(1)
    expect(datasets[0].data).toHaveLength(10)
    expect(resolve(datasets[0].backgroundColor, { y: 9 })).toBe(outlier!.color)
    expect(resolve(datasets[0].backgroundColor, { y: 1 })).toBe('rgba(168, 108, 213, 0.6)')
  })

  it('draws an outlier slightly larger than the cloud around it', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 80, pointRadius: 3 } },
      makeResult(costRecords()),
    ).value

    expect(resolve(datasets[0].pointRadius, { y: 10 })).toBe(4)
    expect(resolve(datasets[0].pointRadius, { y: 1 })).toBe(3)
  })

  it('keeps every dimension in its own series when outliers span several', () => {
    const data: GroupByResult[] = [
      { timestamp: START, event: { cost: 1, route: 'a' } },
      { timestamp: START, event: { cost: 100, route: 'a' } },
      { timestamp: START, event: { cost: 2, route: 'b' } },
      { timestamp: START, event: { cost: 200, route: 'b' } },
    ]
    const display = { route: { a: { name: 'A' }, b: { name: 'B' } } } as DisplayBlob
    const { datasets, outlier } = useScatterDatasets(
      { scatter: { outlierPercentile: 50 } },
      makeResult(data, display),
    ).value

    expect(datasets.map(d => d.label)).toEqual(['A', 'B'])
    expect(datasets.every(d => d.data.length === 2)).toBe(true)
    expect(datasets.map(d => resolve(d.backgroundColor, { y: 1000 }))).toEqual([outlier!.color, outlier!.color])
  })

  it('leaves the legend swatch in the series color', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 50 } },
      makeResult(costRecords()),
    ).value

    // Chart.js resolves a scriptable option with no point on it to build the legend swatch
    expect(resolve(datasets[0].backgroundColor)).toBe('rgba(168, 108, 213, 0.6)')
    expect(resolve(datasets[0].borderColor)).toBe('#a86cd5')
  })

  it('draws points translucent so a dense cloud shows density', () => {
    const { datasets } = useScatterDatasets({}, makeResult(costRecords())).value

    expect(resolve(datasets[0].backgroundColor, { y: 1 })).toBe('rgba(168, 108, 213, 0.6)')
    expect(resolve(datasets[0].borderColor, { y: 1 })).toBe('#a86cd5')
  })

  it('honours an explicit point opacity', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { pointOpacity: 1 } },
      makeResult(costRecords()),
    ).value

    // A fully opaque color serializes as rgb() rather than rgba(..., 1).
    expect(resolve(datasets[0].backgroundColor, { y: 1 })).toBe('rgb(168, 108, 213)')
  })

  it('keeps outlier points opaque so they stay vivid over the cloud', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 80, pointOpacity: 0.2 } },
      makeResult(costRecords()),
    ).value

    expect(resolve(datasets[0].backgroundColor, { y: 10 })).not.toContain('rgba')
  })

  it('omits percentile lines and the outlier threshold when neither is requested', () => {
    const chartData = useScatterDatasets({}, makeResult(costRecords())).value

    expect(chartData.datasets).toHaveLength(1)
    expect(chartData.referenceLines).toBeUndefined()
    expect(chartData.outlier).toBeUndefined()
  })

  it('applies jitter to the x value only', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { jitterMs: 500 } },
      makeResult(costRecords()),
    ).value
    const first = datasets[0].data[0] as { x: number, y: number }
    const baseX = new Date('2024-06-16T00:00:00.000Z').valueOf()

    expect(first.x).not.toBe(baseX)
    expect(Math.abs(first.x - baseX)).toBeLessThanOrEqual(500)
    expect(first.y).toBe(1)
  })

})

describe('useScatterDatasets theming', () => {
  const setToken = (name: string, value: string) =>
    document.documentElement.style.setProperty(name, value)

  const medianColor = () => {
    const { referenceLines } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50 }] } },
      makeResult(costRecords()),
    ).value

    return referenceLines?.[0].color
  }

  afterEach(() => {
    document.documentElement.style.removeProperty('--kui-color-text')
    document.documentElement.style.removeProperty('--kui-color-background-danger')
  })

  it('draws the median in the theme\'s resolved text color', () => {
    setToken('--kui-color-text', '#d2d7d2')

    expect(medianColor()).toBe('#d2d7d2')
  })

  it('draws outliers in the theme\'s resolved danger color', () => {
    setToken('--kui-color-background-danger', '#d78392')

    const { datasets, outlier } = useScatterDatasets(
      { scatter: { outlierPercentile: 80 } },
      makeResult(costRecords()),
    ).value

    expect(outlier?.color).toBe('#d78392')
    expect(resolve(datasets[0].borderColor, { y: 10 })).toBe('#d78392')
  })

  it('honours an explicit color over the theme token', () => {
    setToken('--kui-color-text', '#d2d7d2')

    const { referenceLines } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50, color: '#ff00ff' }] } },
      makeResult(costRecords()),
    ).value

    expect(referenceLines?.[0].color).toBe('#ff00ff')
  })

  it('repaints when the owning component re-resolves the theme colors', () => {
    const themeColors = ref(scatterChartColors())

    setToken('--kui-color-text', '#000000')
    themeColors.value = scatterChartColors()

    const chartData = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50 }] }, themeColors },
      makeResult(costRecords()),
    )

    expect(chartData.value.referenceLines?.[0].color).toBe('#000000')

    setToken('--kui-color-text', '#ffffff')
    themeColors.value = scatterChartColors()

    expect(chartData.value.referenceLines?.[0].color).toBe('#ffffff')
  })
})

describe('useScatterDatasets extras', () => {
  const withExtras = (values: number[]): ComputedRef<ScatterChartData> => computed(() => ({
    points: values.map((value, i) => ({
      timestamp: new Date(START).valueOf() + i * 1000,
      value,
      extras: [{ label: 'Tokens', value: value * 100, unit: 'token count' }],
    })),
    metric: 'cost',
    start: START,
    end: END,
  }))

  it('carries extras onto the plotted points', () => {
    const { datasets } = useScatterDatasets({}, withExtras([1, 2, 3])).value

    expect(datasets[0].data).toEqual([
      expect.objectContaining({ y: 1, extras: [{ label: 'Tokens', value: 100, unit: 'token count' }] }),
      expect.objectContaining({ y: 2, extras: [{ label: 'Tokens', value: 200, unit: 'token count' }] }),
      expect.objectContaining({ y: 3, extras: [{ label: 'Tokens', value: 300, unit: 'token count' }] }),
    ])
  })

  it('keeps extras on outlier points', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 50 } },
      withExtras([1, 2, 3, 4, 100]),
    ).value

    for (const point of datasets[0].data as Array<{ extras?: unknown[] }>) {
      expect(point.extras).toHaveLength(1)
    }
  })

  it('omits the key entirely when a point has no extras', () => {
    const { datasets } = useScatterDatasets({}, makeResult(costRecords())).value

    expect(datasets[0].data.every(point => !('extras' in (point as object)))).toBe(true)
  })
})

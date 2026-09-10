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

  it('adds percentile line datasets spanning the query time range', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50 }, { percentile: 95 }] } },
      makeResult(costRecords()),
    ).value

    const median = datasets.find(d => d.label === 'Median')
    const p95 = datasets.find(d => d.label === 'p95')

    expect(median).toBeDefined()
    expect(p95).toBeDefined()
    // rank = 0.5 * 9 = 4.5, midway between 5 and 6
    expect(median!.data).toEqual([
      { x: new Date(START).valueOf(), y: 5.5 },
      { x: new Date(END).valueOf(), y: 5.5 },
    ])
    expect(median!.total).toBe(5.5)
  })

  it('splits points above the outlier percentile into their own dataset', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 80 } },
      makeResult(costRecords()),
    ).value

    const outliers = datasets.find(d => d.label === 'Outlier (> p80)')

    expect(outliers).toBeDefined()
    expect(outliers!.data).toEqual([
      { x: expect.any(Number), y: 9, tooltipLabel: 'Costs (outlier > p80)' },
      { x: expect.any(Number), y: 10, tooltipLabel: 'Costs (outlier > p80)' },
    ])
    expect(datasets[0].data).toHaveLength(8)
  })

  it('collects outliers from every series into a single dataset', () => {
    const data: GroupByResult[] = [
      { timestamp: START, event: { cost: 1, route: 'a' } },
      { timestamp: START, event: { cost: 100, route: 'a' } },
      { timestamp: START, event: { cost: 2, route: 'b' } },
      { timestamp: START, event: { cost: 200, route: 'b' } },
    ]
    const display = { route: { a: { name: 'A' }, b: { name: 'B' } } } as DisplayBlob
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 50 } },
      makeResult(data, display),
    ).value

    const outliers = datasets.filter(d => d.rawDimension === 'outlier')

    expect(outliers).toHaveLength(1)
    expect(outliers[0].data).toHaveLength(2)
    expect(outliers[0].data.map((point: any) => point.tooltipLabel)).toEqual([
      'A (outlier > Median)',
      'B (outlier > Median)',
    ])
  })

  it('draws points translucent so a dense cloud shows density', () => {
    const { datasets } = useScatterDatasets({}, makeResult(costRecords())).value

    expect(datasets[0].backgroundColor).toBe('rgba(168, 108, 213, 0.6)')
    expect(datasets[0].borderColor).toBe('#a86cd5')
  })

  it('honours an explicit point opacity', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { pointOpacity: 1 } },
      makeResult(costRecords()),
    ).value

    // A fully opaque color serializes as rgb() rather than rgba(..., 1).
    expect(datasets[0].backgroundColor).toBe('rgb(168, 108, 213)')
  })

  it('keeps outlier points opaque so they stay vivid over the cloud', () => {
    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 80, pointOpacity: 0.2 } },
      makeResult(costRecords()),
    ).value

    const outliers = datasets.find(d => d.rawDimension === 'outlier')

    expect(outliers?.backgroundColor).not.toContain('rgba')
  })

  it('omits percentile lines when none are requested', () => {
    const { datasets } = useScatterDatasets({}, makeResult(costRecords())).value

    expect(datasets).toHaveLength(1)
    expect(datasets[0].type).toBe('scatter')
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
    const { datasets } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50 }] } },
      makeResult(costRecords()),
    ).value

    return datasets.find(d => d.label === 'Median')?.borderColor
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

    const { datasets } = useScatterDatasets(
      { scatter: { outlierPercentile: 80 } },
      makeResult(costRecords()),
    ).value

    expect(datasets.find(d => d.rawDimension === 'outlier')?.borderColor).toBe('#d78392')
  })

  it('honours an explicit color over the theme token', () => {
    setToken('--kui-color-text', '#d2d7d2')

    const { datasets } = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50, color: '#ff00ff' }] } },
      makeResult(costRecords()),
    ).value

    expect(datasets.find(d => d.label === 'Median')?.borderColor).toBe('#ff00ff')
  })

  it('repaints when the owning component re-resolves the theme colors', () => {
    const themeColors = ref(scatterChartColors())

    setToken('--kui-color-text', '#000000')
    themeColors.value = scatterChartColors()

    const chartData = useScatterDatasets(
      { scatter: { percentileLines: [{ percentile: 50 }] }, themeColors },
      makeResult(costRecords()),
    )

    expect(chartData.value.datasets.find(d => d.label === 'Median')?.borderColor).toBe('#000000')

    setToken('--kui-color-text', '#ffffff')
    themeColors.value = scatterChartColors()

    expect(chartData.value.datasets.find(d => d.label === 'Median')?.borderColor).toBe('#ffffff')
  })
})

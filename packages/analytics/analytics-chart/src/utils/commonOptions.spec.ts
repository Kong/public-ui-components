import type { ExternalTooltipContext, TooltipState } from '../types'
import { hasTimeseriesData, lineChartTooltipBehavior } from './commonOptions'

describe('commonOptions.hasTimeseriesData', () => {

  it('is valid for timeseries data with only 1 datapoint', () => {
    const lineChartData = {
      datasets: [
        {
          rawMetric: 'test1',
          rawDimension: 'test1',
          label: 'test1',
          data: [
            {
              x: 1678262400000,
              y: 10,
            },
          ],
        },
        {
          rawMetric: 'test2',
          rawDimension: 'test2',
          label: 'test2',
          data: [
            {
              x: 1677744000000,
              y: 10,
            },
          ],
        },
      ],
    }

    const valid = hasTimeseriesData(lineChartData)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(valid).true
  })

  it('is not valid for empty series', () => {
    const lineChartData = {
      datasets: [
        {
          rawMetric: 'test1',
          rawDimension: 'test1',
          label: 'test1',
          data: [
          ],
        },
        {
          rawMetric: 'test2',
          rawDimension: 'test2',
          label: 'test2',
          data: [
          ],
        },
      ],
    }

    const valid = hasTimeseriesData(lineChartData)
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(valid).false
  })

  it('is not valid for non-point-like series', () => {
    const testChartData = {
      labels: [
        'test1',
        'test2',
      ],
      datasets: [
        {
          rawDimension: 'test1',
          rawMetric: 'test1',
          label: 'test1',
          data: [
            10,
            0,
          ],
        },
        {
          rawDimension: 'test2',
          rawMetric: 'test2',
          label: 'test2',
          data: [
            0,
            20,
          ],
        },
      ],
    }

    const valid = hasTimeseriesData(testChartData)

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(valid).false
  })
})

describe('commonOptions.lineChartTooltipBehavior', () => {
  const makeContext = (datasets: Array<{ label: string, unit?: string }>) => ({
    chart: { config: { options: {} } },
    tooltip: {
      opacity: 1,
      body: [{}],
      x: 0,
      y: 0,
      labelColors: datasets.map(() => ({ backgroundColor: '#000', borderColor: '#000' })),
      dataPoints: datasets.map((dataset, i) => ({
        parsed: { x: 1678262400000, y: i + 1 },
        raw: { x: 1678262400000, y: i + 1 },
        dataset,
      })),
    },
  }) as unknown as ExternalTooltipContext

  it('formats each series with its dataset unit, falling back to the chart unit', () => {
    const tooltipData = {
      showTooltip: false,
      interactionMode: 'idle',
      units: 'count',
      translateUnit: (unit: string) => unit,
      tooltipSeries: [],
    } as unknown as TooltipState

    lineChartTooltipBehavior(tooltipData, makeContext([{ label: 'requests' }, { label: 'latency', unit: 'ms' }]), 'minutely')

    const values = Object.fromEntries(tooltipData.tooltipSeries.map(entry => [entry.label, entry.value]))
    expect(values.requests).toContain('count')
    expect(values.latency).toContain('ms')
  })
})

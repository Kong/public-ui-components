import { hasTimeseriesData } from './commonOptions'

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

    expect(valid).false
  })
})

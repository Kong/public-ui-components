import type { Dataset, KChartData } from '../types'
import { STATUS_CODE_DIMENSIONS } from '../types'
import { isValid } from 'date-fns'

const hasTimeseriesData = (chartData: KChartData) => {
  return chartData.datasets.some(dataset => {
    const first = dataset.data[0]

    return typeof first === 'object' && first !== null && 'x' in first && isValid(new Date(first.x))
  })
}

export const hasMillisecondTimestamps = (chartData: KChartData) =>
  hasTimeseriesData(chartData) &&
  chartData.datasets.some(dataset => {
    const first = dataset.data[0]

    return typeof first === 'object' &&
      first !== null &&
      'x' in first &&
      Number(first.x).toString().length >= 13
  })

export const sortDatasetsByDimension = (
  datasets: Dataset[],
  dimension: string,
): void => {
  if (STATUS_CODE_DIMENSIONS.includes(dimension as typeof STATUS_CODE_DIMENSIONS[number])) {
    datasets.sort((a, b) => (a.label ?? '') < (b.label ?? '') ? -1 : 1)
  } else {
    datasets.sort((a, b) => Number(a.total) < Number(b.total) ? -1 : 1)
  }
}

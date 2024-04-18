/* eslint-disable no-unused-vars */
export enum ChartTypes {
  DOUGHNUT = 'Doughnut',
  HORIZONTAL_BAR = 'HorizontalBar',
  VERTICAL_BAR = 'VerticalBar',
  TIMESERIES_LINE = 'Line',
  TIMESERIES_BAR = 'TimeSeriesBar'
}

export const reportChartTypes = [
  'horizontal_bar',
  'vertical_bar',
  'timeseries_line',
  // TODO: Clean these up later
  'HorizontalBar',
  'VerticalBar',
  'Line',

] as const

export type ReportChartTypes = typeof reportChartTypes[number]

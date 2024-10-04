export const reportChartTypes = [
  'horizontal_bar',
  'vertical_bar',
  'timeseries_line',
] as const

export type ReportChartTypes = typeof reportChartTypes[number]

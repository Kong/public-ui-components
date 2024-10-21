export const reportChartTypes = [
  'horizontal_bar',
  'vertical_bar',
  'timeseries_line',
  'choropleth_map',
] as const

export type ReportChartTypes = typeof reportChartTypes[number]

export const chartTypes = [
  'doughnut',
  'horizontal_bar',
  'vertical_bar',
  'timeseries_line',
  'timeseries_bar',
  'choropleth_map',
] as const

export type ChartType = typeof chartTypes[number]

export const simpleChartTypes = [
  'gauge',
  'top_n',
] as const

export type SimpleChartType = typeof simpleChartTypes[number]

export const chartTypes = [
  'donut',
  'horizontal_bar',
  'vertical_bar',
  'timeseries_line',
  'timeseries_bar',
] as const

export type ChartType = typeof chartTypes[number]

export const simpleChartTypes = [
  'gauge',
  'top_n',
  'single_value',
] as const

export type SimpleChartType = typeof simpleChartTypes[number]

export type SparklineType = 'sparkline_bar' | 'sparkline_line' | 'sparkline_step'

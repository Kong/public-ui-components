export const reportChartTypes = [
  'horizontal_bar',
  'vertical_bar',
  'timeseries_line',
  'choropleth_map',
  'timeseries_bar',
  'donut',
  'single_value',
  'top_n',
  'table',
  'scatter',
  'heatmap',
  'treemap',
] as const

export type ReportChartTypes = typeof reportChartTypes[number]

/** Metrics that can't be summed across dimension values, e.g. averages, percentiles, rates, maxes */
export const NON_ADDITIVE_METRIC = /_(average|p\d+|rate|max|per_minute)$/

export const isMetricSupported = (chartType: ReportChartTypes, metric: string): boolean => {
  return chartType !== 'treemap' || !NON_ADDITIVE_METRIC.test(metric)
}

export const UNITLESS_METRICS = new Set([
  'control_plane_count',
  'service_count',
  'route_count',
  'consumer_count',
  'plugin_count',
  'node_count',
  'usd',
])

export const isUnitlessMetricUnit = (unit: string): boolean => {
  return UNITLESS_METRICS.has(unit)
}

export const SUMMABLE_METRIC_UNITS = new Set([
  'count',
  'usd',
  'token count',
  'control_plane_count',
  'service_count',
  'route_count',
  'consumer_count',
  'plugin_count',
  'node_count',
])

export const isSummableMetricUnit = (unit: string): boolean => {
  return SUMMABLE_METRIC_UNITS.has(unit)
}

export const isSummableMetricName = (name: string): boolean => {
  return name.endsWith('_sum') || name.endsWith(':sum')
}


export const isNoSuffixMetric = (unit: string): boolean => {
  return unit.toLocaleLowerCase().endsWith('count')
}

// Unit-based checks don't work for size metrics since all aggregations (sum, avg, percentiles) share
// the same 'bytes' unit. Check the metric name instead — both _sum (Druid) and :sum (GOAP) notations.
export const isSummableMetric = (name: string): boolean => {
  const lowerName = name.toLocaleLowerCase()
  return [
    'sum', 'count', 'cost', 'tokens',
  ].some(summableSuffix => lowerName.endsWith(summableSuffix))
}

import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

export const exploreResultToCountryMetrics = (exploreResult: ExploreResultV4): Record<string, number> => {
  if (!exploreResult || !exploreResult.data) {
    return {}
  }

  const metrics = {} as Record<string, number>
  const data = exploreResult.data

  if (data) {
    for (const row of data) {
      const countryKey = row?.event?.country_code
      const metricKey = exploreResult.meta.metric_names?.[0]

      if (countryKey) {
        metrics[countryKey] = metricKey ? row.event[metricKey] as number : 0
      }
    }
  }

  return metrics
}

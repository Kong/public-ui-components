import { computed, type Ref } from 'vue'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'

export default function useMetricUtils({
  countryMetrics,
  metric,
}: {
  countryMetrics: Readonly<Ref<Record<string, number>>>
  metric: Readonly<Ref<ExploreAggregations>>
}) {

  const logMinMetric = computed(() => Math.log(Math.min(...Object.values(countryMetrics.value))))
  const logMaxMetric = computed(() => Math.log(Math.max(...Object.values(countryMetrics.value))))
  const shouldTuncateMetric = computed(() => {
    return !metric.value?.includes('latency')
  })

  const legendData = computed(() => {
    const range = logMaxMetric.value - logMinMetric.value
    const step = range / 5

    const intervals = [
      logMinMetric.value + 4 * step,
      logMinMetric.value + 3 * step,
      logMinMetric.value + 2 * step,
      logMinMetric.value + 1 * step,
      logMinMetric.value,
    ]

    return intervals.map((logBoundary, index) => {
      const nextLogBoundary = index === 0 ? logMaxMetric.value : intervals[index - 1]
      const lowerLinear = Math.exp(logBoundary)
      const upperLinear = Math.exp(nextLogBoundary)

      let rangeText = ''
      if (index === 0) {
        rangeText = `> ${formatMetric(lowerLinear)}`
      } else if (index === intervals.length - 1) {
        rangeText = `< ${formatMetric(upperLinear)}`
      } else {
        rangeText = `${formatMetric(lowerLinear)} - ${formatMetric(upperLinear)}`
      }

      return {
        color: getColor(lowerLinear),
        range: rangeText,
      }
    })
  })

  const getColor = (linearMetric: number) => {
    const logMetric = Math.log(linearMetric)
    const range = logMaxMetric.value - logMinMetric.value
    const step = range / 5

    if (logMetric >= logMinMetric.value + 4 * step) return '#00819d'
    if (logMetric >= logMinMetric.value + 3 * step) return '#00abd2'
    if (logMetric >= logMinMetric.value + 2 * step) return '#00c8f4'
    if (logMetric >= logMinMetric.value + 1 * step) return '#67e3ff'
    return '#b3f1ff'
  }

  const formatMetric = (linearMetric: number) => {
    const truncated = Math.trunc(linearMetric)

    if (shouldTuncateMetric.value) {
      return approxNum(truncated, { capital: true })
    }

    return new Intl.NumberFormat(document?.documentElement?.lang || 'en-US').format(truncated)
  }

  return {
    getColor,
    formatMetric,
    legendData,
  }
}

import { computed, type Ref } from 'vue'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER } from '@kong/design-tokens'

const MAX_LEGEND_BUCKETS = 5

export const colors = [
  '#00819d',
  '#00abd2',
  '#00c8f4',
  '#67e3ff',
  '#b3f1ff',
]

const quantile = (sorted: number[], p: number): number => {
  const n = sorted.length
  if (!n) {
    return NaN
  }

  const i = (n - 1) * p
  const lower = Math.floor(i)
  const upper = Math.ceil(i)
  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] + (i - lower) * (sorted[upper] - sorted[lower])
}

const generateScale = (values: number[], buckets: number): number[] => {
  if (values.length === 0) {
    return []
  }
  const sorted = values.filter(e => e > 0).map(Math.log).sort((a, b) => a - b)

  const cuts = Array.from({ length: buckets }, (_, i) => {
    return quantile(sorted, i / buckets)
  })

  return cuts.map(e => Math.exp(e)).reverse()
}

export default function useMetricUtils({
  countryMetrics,
  metric,
}: {
  countryMetrics: Readonly<Ref<Record<string, number>>>
  metric: Readonly<Ref<ExploreAggregations>>
}) {

  const values = computed(() => Object.values(countryMetrics.value) as number[])
  const datapointCount = computed(() => Object.keys(countryMetrics.value).length)
  const buckets = computed(() => datapointCount.value < MAX_LEGEND_BUCKETS - 1 ? datapointCount.value : MAX_LEGEND_BUCKETS)

  const shouldTuncateMetric = computed(() => {
    return !metric.value?.includes('latency')
  })

  const scale = computed(() => generateScale(values.value, buckets.value))

  const legendData = computed(() => {
    if (values.value.length === 1) {
      return [{
        color: getColor(values.value[0]),
        range: formatMetric(values.value[0]),
      }]
    }

    return scale.value.map((interval, index) => {
      const nextLogBoundary = index === 0 ? Math.max(...scale.value) : scale.value[index - 1]
      const lower = interval
      const upper = nextLogBoundary

      let rangeText = ''
      if (index === 0) {
        rangeText = `> ${formatMetric(lower)}`
      } else if (index === scale.value.length - 1) {
        rangeText = `< ${formatMetric(upper)}`
      } else {
        rangeText = `${formatMetric(lower)} - ${formatMetric(upper)}`
      }

      return {
        color: getColor(lower),
        range: rangeText,
      }
    })
  })

  const getColor = (metric: number) => {
    if (metric === 0) {
      return KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER
    }

    const idx = scale.value.findIndex((interval) => metric >= interval)
    if (idx === -1) {
      return colors[colors.length - 1]
    }
    return colors[idx] ?? KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER
  }

  const formatMetric = (metric: number): string => {
    const truncated = Math.trunc(metric)

    if (shouldTuncateMetric.value) {
      return approxNum(truncated, { capital: true })
    }

    return new Intl.NumberFormat(document?.documentElement?.lang || 'en-US').format(truncated)
  }

  return {
    getColor,
    formatMetric,
    legendData,
    scale,
  }
}

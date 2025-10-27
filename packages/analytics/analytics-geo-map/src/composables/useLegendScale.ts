import { computed, type Ref } from 'vue'
import { COUNTRIES, type ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER } from '@kong/design-tokens'
import type { MetricUnits } from '../types'
import composables from '.'

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

const generateLogScale = (values: number[], buckets: number): number[] => {
  if (values.length === 0) {
    return []
  }
  const sorted = values.filter(e => e > 0).map(Math.log).sort((a, b) => a - b)
  const min = Math.min(...sorted)
  const max = Math.max(...sorted)
  const step = (max - min) / buckets

  const cuts = Array.from({ length: buckets }, (_, i) => {
    return min + i * step
  })

  return cuts.map(e => Math.exp(e)).reverse()
}

export default function useLegendScale({
  countryMetrics,
  metric,
  unit,
}: {
  countryMetrics: Readonly<Ref<Record<string, number>>>
  metric: Readonly<Ref<ExploreAggregations>>
  unit: Readonly<Ref<MetricUnits>>
}) {

  const { formatMetric, formatMetricRange } = composables.useMetricFormat({ unit })

  const filteredMetrics = computed(() => {
    const metrics = { ...countryMetrics.value }
    for (const code of Object.keys(metrics)) {
      if (!COUNTRIES.find(c => c.code === code)) {
        delete metrics[code]
      }
    }
    return metrics
  })

  const values = computed(() => Object.values(filteredMetrics.value) as number[])
  const datapointCount = computed(() => Object.keys(filteredMetrics.value).length)
  const buckets = computed(() => datapointCount.value < MAX_LEGEND_BUCKETS - 1 ? datapointCount.value : MAX_LEGEND_BUCKETS)
  const approximateMetric = computed(() => {
    return !metric.value?.includes('latency')
  })

  const scale = computed(() => {
    const scale: number[] = []

    if (values.value.length > 10) {
      const sortedValues = [...values.value].sort((a, b) => a - b)
      const cutoff = quantile(sortedValues, 0.75)
      const top = values.value.filter(v => v >= cutoff)
      const bottom = values.value.filter(v => v < cutoff)

      const scale1 = generateLogScale(top, 3)
      const scale2 = generateLogScale(bottom, 2)
      scale.push(...scale1, ...scale2)
      return scale
    }

    return generateLogScale(values.value, buckets.value)
  })

  const legendData = computed(() => {
    if (values.value.length === 1) {
      return [{
        color: getColor(values.value[0]),
        range: formatMetric(values.value[0], {
          approximate: approximateMetric.value,
          showUnit: !unit.value.includes('count'),
        }).trim(),
      }]
    }

    return scale.value.map((interval, index) => {
      const nextLogBoundary = index === 0 ? Math.max(...scale.value) : scale.value[index - 1]
      const lower = interval
      const upper = nextLogBoundary

      // Hide unit for count metrics in legend ranges
      let rangeText = ''
      if (index === 0) {
        rangeText = `> ${formatMetric(lower, {
          showUnit: !unit.value.includes('count'),
          approximate: approximateMetric.value,
        })}`.trim()
      } else if (index === scale.value.length - 1) {
        rangeText = `< ${formatMetric(upper, {
          showUnit: !unit.value.includes('count'),
          approximate: approximateMetric.value,
        })}`.trim()
      } else {
        rangeText = formatMetricRange(lower, upper, {
          showUnit: !unit.value.includes('count'),
          approximate: approximateMetric.value,
        }).trim()
      }

      return {
        color: getColor(lower),
        range: rangeText,
      }
    })
  })

  const getColor = (value: number) => {
    if (value === 0) {
      return KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER
    }

    const idx = scale.value.findIndex((interval) => value >= interval)
    if (idx === -1) {
      return colors[colors.length - 1]
    }
    return colors[idx] ?? KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER
  }

  return {
    getColor,
    legendData,
    scale,
  }
}

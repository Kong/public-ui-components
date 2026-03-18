import type { LegendValues, KChartData } from '../types'
import type { Ref } from 'vue'
import { computed } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import composables from '.'

const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

export default function useChartLegendValues(
  chartData: Readonly<Ref<KChartData>>,
  metricUnit: Readonly<Ref<string>>,
) {
  const { i18n } = composables.useI18n()
  const { formatBytes } = unitFormatter({ i18n })
  const { translateUnit } = composables.useTranslatedUnits()

  const legendValues = computed<LegendValues>(() => {
    const values: LegendValues = {}

    chartData.value.datasets.forEach((dataset) => {
      const raw = typeof dataset.total === 'number'
        ? dataset.total
        : dataset.data.reduce<number>((sum, entry) => {
          return sum + (typeof entry === 'number' ? Number(entry) || 0 : Number(entry?.y) || 0)
        }, 0)

      const formatted = metricUnit.value === 'bytes'
        ? formatBytes(raw)
        : i18n.t('legend.datapointValueDisplay', {
          value: formatCompactNumber(raw),
          unit: translateUnit(metricUnit.value, raw),
        })

      values[dataset.label as string] = {
        raw,
        formatted,
        isThreshold: dataset.isThreshold,
      }
    })

    return values
  })

  return { legendValues }
}

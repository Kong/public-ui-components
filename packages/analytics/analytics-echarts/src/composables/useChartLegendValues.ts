import type { LegendValues, KChartData } from '../types'
import type { Ref } from 'vue'
import { computed } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import useI18n from './useI18n'
import useTranslatedUnits from './useTranslatedUnits'

const APPROXIMATE_LEGEND_UNITS = ['count', 'count/minute', 'token count']

export default function useChartLegendValues(
  chartData: Readonly<Ref<KChartData>>,
  metricUnit: Readonly<Ref<string>>,
) {
  const { i18n } = useI18n()
  const { formatUnit } = unitFormatter({ i18n })
  const { translateUnit } = useTranslatedUnits()

  const legendValues = computed<LegendValues>(() => {
    const values: LegendValues = {}

    chartData.value.datasets.forEach((dataset) => {
      const raw = typeof dataset.total === 'number'
        ? dataset.total
        : dataset.data.reduce<number>((sum, entry) => {
          return sum + (typeof entry === 'number' ? Number(entry) || 0 : Number(entry?.y) || 0)
        }, 0)

      const formatted = formatUnit(raw, metricUnit.value, {
        approximate: APPROXIMATE_LEGEND_UNITS.includes(metricUnit.value),
        translateUnit,
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

import type { AnalyticsDataPoint, ChartType, KChartData, LegendValues, SimpleChartType } from '../types'
import type { Ref } from 'vue'
import { computed } from 'vue'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import { useFormatUnit } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'

export default function useChartLegendValues(
  chartData: Readonly<Ref<KChartData>>,
  chartType: ChartType | SimpleChartType,
  metricUnit: Readonly<Ref<string>>,
) {
  const { i18n } = composables.useI18n()
  const { formatBytes } = useFormatUnit({ i18n })
  const { translateUnit } = composables.useTranslatedUnits()
  const legendValues = computed<LegendValues>(() => {
    return chartData.value.datasets.reduce((a, v) => {
      const raw = v.total
        ? v.total
        : (v.data as Array<number | AnalyticsDataPoint>).reduce((acc: number, e: number | AnalyticsDataPoint) => {
          return acc + (typeof e === 'number' ? Number(e) || 0 : Number(e && e.y) || 0)
        }, 0) as number

      let formatted: string

      if (metricUnit.value === 'bytes') {
        formatted = formatBytes(raw)
      } else {
        // TODO should we be using approxNum in legend values? Might be better
        // to always use formatUnit whenever we're formatting a unit.
        // @ts-ignore - dynamic i18n key
        const unitValue = translateUnit(metricUnit.value, raw)
        formatted = (i18n && i18n.t('legend.datapointValueDisplay', {
          value: approxNum(raw, { capital: true }),
          unit: unitValue,
        })) || `${approxNum(raw, { capital: true })} ${metricUnit.value}`
      }

      return {
        ...a,
        [v.label as string]: {
          raw,
          formatted,
          isThreshold: v.isThreshold,
        },
      }
    }, {})
  })

  return { legendValues }
}

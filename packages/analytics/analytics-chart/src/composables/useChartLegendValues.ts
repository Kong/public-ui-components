import type { AnalyticsDataPoint, KChartData, LegendValues } from '../types'
import type { ChartTypes, ChartTypesSimple } from '../enums'
import type { Ref } from 'vue'
import { computed } from 'vue'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import prettyBytes from 'pretty-bytes'
import composables from '../composables'

export default function useChartLegendValues(chartData: Ref<KChartData>, chartType: ChartTypes | ChartTypesSimple, metricUnit: Ref<string>) {
  const { i18n } = composables.useI18n()
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
        formatted = isNaN(raw) ? '0' : prettyBytes(raw)
      } else {
        // @ts-ignore - dynamic i18n key
        const unitValue = translateUnit(metricUnit.value, raw)
        formatted = (i18n && i18n.t('legend.datapointValueDisplay', {
          value: approxNum(raw, { capital: true }),
          unit: unitValue,
        })) || `${approxNum(raw, { capital: true })} ${metricUnit.value}`
      }

      return { ...a, [v.label as string]: { raw, formatted } }
    }, {})
  })

  return { legendValues }
}

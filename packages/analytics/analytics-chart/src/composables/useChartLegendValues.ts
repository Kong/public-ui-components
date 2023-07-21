import { AnalyticsDataPoint, KChartData, LegendValues } from '../types'
import { ChartTypes, ChartTypesSimple } from '../enums'
import { computed, Ref } from 'vue'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'
import prettyBytes from 'pretty-bytes'
import composables from '../composables'

export default function useChartLegendValues(chartData: Ref<KChartData>, chartType: ChartTypes | ChartTypesSimple, metricUnit: Ref<string>) {
  const { i18n } = composables.useI18n()
  const legendValues = computed<LegendValues>(() => {
    return chartData.value.datasets.reduce((a, v) => {
      const raw = v.total
        ? v.total
        : (v.data as Array<number | AnalyticsDataPoint>).reduce((acc: number, e: number | AnalyticsDataPoint) => {
          return acc + (typeof e === 'number' ? Number(e) || 0 : Number(e.y) || 0)
        }, 0) as number

      let formatted: string

      if (metricUnit.value === 'bytes') {
        formatted = isNaN(raw) ? '0' : prettyBytes(raw)
      } else {
        formatted = `${approxNum(raw, { capital: true })} ${metricUnit.value}`

        // @ts-ignore - dynamic i18n key
        const unitValue = (metricUnit.value && i18n && i18n.te(`chartUnits.${metricUnit.value}`) && i18n.t(`chartUnits.${metricUnit.value}`)) || metricUnit.value
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

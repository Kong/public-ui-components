import type { Ref } from 'vue'
import type { MetricUnits } from '../types'
import composables from '.'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'

export default function useMetricFormat({
  unit,
}: {
  unit: Readonly<Ref<MetricUnits>>
}) {
  const { i18n } = composables.useI18n()
  const { formatUnit, formatRange } = unitFormatter({ i18n })

  const formatMetric = (value: number, {
    showUnit = true,
    approximate = false,
  }: {
    showUnit?: boolean
    approximate?: boolean
  } = {}): string => {
    return formatUnit(value, unit.value, {
      approximate,
      translateUnit: (unit: string) => {
        return showUnit ? i18n.t(`metricUnits.${unit}` as any, { plural: value > 1 ? 's' : '' }) : ''
      },
    })
  }

  const formatMetricRange = (min: number, max: number, {
    showUnit = true,
    approximate = false,
  }: {
    showUnit?: boolean
    approximate?: boolean
  } = {}): string => {
    return formatRange(min, max, unit.value, {
      approximate,
      translateUnit: (unit) => {
        return showUnit ? i18n.t(`metricUnits.${unit}` as any, { plural: max > 1 ? 's' : '' }) : ''
      },
    })
  }

  return {
    formatMetric,
    formatMetricRange,
  }
}

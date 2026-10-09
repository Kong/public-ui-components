import type { AllAggregations, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import useI18n from './useI18n'

// Counts read better as a bare number, e.g. "10" rather than "10 count"
const translateUnit = (unit: string): string => unit.toLowerCase().endsWith('count') ? '' : unit

/** Builds the series name and value formatter for the first metric of an explore result */
export default function useMetricFormatter() {
  const { i18n } = useI18n()
  const { formatUnit } = unitFormatter({ i18n })
  const datasourceConfigStore = useDatasourceConfigStore()

  return (result: ExploreResultV4) => {
    const metric = (result.meta?.metric_names?.[0] ?? '') as AllAggregations
    const unit = result.meta?.metric_units?.[metric] ?? ''
    const key = `chartLabels.${metric}`
    // @ts-ignore dynamic lookup
    const seriesName = datasourceConfigStore.fieldTranslationMap.get(metric)
      // @ts-ignore dynamic lookup
      ?? (i18n.te(key) ? i18n.t(key) : metric)

    return {
      seriesName: seriesName as string,
      valueFormatter: (value: number): string => formatUnit(value, unit, { translateUnit }),
    }
  }
}

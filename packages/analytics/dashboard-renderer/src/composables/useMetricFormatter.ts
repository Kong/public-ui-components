import type { AllAggregations, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'

import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import useI18n from './useI18n'
import composables from '../composables'

// Counts read better as a bare number, e.g. "10" rather than "10 count"
const translateUnit = (unit: string): string => unit.toLowerCase().endsWith('count') ? '' : unit

/** Builds the series name and value formatter for the first metric of an explore result */
export default function useMetricFormatter() {
  const { i18n } = useI18n()
  const { formatUnit } = unitFormatter({ i18n })
  const fieldLabel = composables.useFieldLabel()

  return (result: ExploreResultV4) => {
    const metric = (result.meta?.metric_names?.[0] ?? '') as AllAggregations
    const unit = result.meta?.metric_units?.[metric] ?? ''

    return {
      seriesName: fieldLabel(metric),
      valueFormatter: (value: number): string => formatUnit(value, unit, { translateUnit }),
    }
  }
}

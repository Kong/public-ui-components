import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ExploreAggregations, GranularityValues } from '@kong-ui-public/analytics-utilities'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { ChartTooltipSortFn, KChartData, Threshold, TooltipState } from '../types'

import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import { buildTimeseriesOption, getThresholdIntersections } from '../utils'
import composables from '.'

export { getThresholdIntersections }

export default function useTimeseriesChartOption({
  chartData,
  chartType,
  tooltipState,
  granularity,
  stacked,
  threshold,
  metricUnit,
  tooltipTitle,
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn,
}: {
  chartData: Ref<KChartData>
  chartType: Ref<'timeseries_line' | 'timeseries_bar'>
  tooltipState: Ref<TooltipState>
  granularity: Ref<GranularityValues>
  stacked: Ref<boolean>
  threshold: Ref<Partial<Record<ExploreAggregations, Threshold[]>> | undefined>
  metricUnit: Ref<string>
  tooltipTitle?: Ref<string | undefined>
  tooltipMetricDisplay?: Ref<string | undefined>
  metricAxisTitle?: Ref<string | undefined>
  dimensionAxisTitle?: Ref<string | undefined>
  selectedLabels: Ref<Record<string, boolean>>
  chartTooltipSortFn?: Ref<ChartTooltipSortFn | undefined>
}) {
  const { i18n } = composables.useI18n()
  const { translateUnit } = composables.useTranslatedUnits()
  const { formatUnit } = unitFormatter({ i18n })

  const option = computed<ECBasicOption>(() => {
    try {
      if (!chartData.value.datasets.length) {
        return {}
      }

      return buildTimeseriesOption({
        chartData: chartData.value,
        chartType: chartType.value,
        stacked: stacked.value,
        granularity: granularity.value,
        tooltipState: tooltipState.value,
        tooltipTitle: tooltipTitle?.value,
        tooltipMetricDisplay: tooltipMetricDisplay?.value,
        metricAxisTitle: metricAxisTitle?.value,
        dimensionAxisTitle: dimensionAxisTitle?.value,
        threshold: threshold.value,
        selectedLabels: selectedLabels.value,
        formatValue: (value: number) => formatUnit(value, metricUnit.value, { translateUnit }),
        thresholdLabelFormatter: (currentThreshold: Threshold) => {
          const key = `chartLabels.threshold-${currentThreshold.type}`
          const fallbackKey = currentThreshold.type === 'neutral'
            ? 'chartLabels.threshold-neutral'
            : key

          return (i18n as any).te(key)
            ? (i18n as any).t(key, { value: String(currentThreshold.value) })
            : (i18n as any).t(fallbackKey, { value: String(currentThreshold.value) })
        },
        chartTooltipSortFn: chartTooltipSortFn?.value,
      })
    } catch (err) {
      console.error(err)

      return {}
    }
  })

  return { option }
}

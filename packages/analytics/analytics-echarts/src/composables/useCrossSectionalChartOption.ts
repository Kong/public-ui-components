import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { ChartScrollWindow, ChartTooltipSortFn, KChartData, TooltipState } from '../types'

import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import { buildCrossSectionOption } from '../utils'
import composables from '.'

export default function useCrossSectionalChartOption({
  chartData,
  chartType,
  chartWidth,
  chartHeight,
  scrollWindow,
  showAnnotations,
  tooltipState,
  stacked,
  metricUnit,
  tooltipTitle,
  tooltipMetricDisplay,
  metricAxisTitle,
  dimensionAxisTitle,
  selectedLabels,
  chartTooltipSortFn,
}: {
  chartData: Ref<KChartData>
  chartType: Ref<'horizontal_bar' | 'vertical_bar' | 'donut'>
  chartWidth: Ref<number>
  chartHeight: Ref<number>
  scrollWindow: Ref<ChartScrollWindow | null>
  showAnnotations: Ref<boolean>
  tooltipState: Ref<TooltipState>
  stacked: Ref<boolean>
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

      return buildCrossSectionOption({
        chartData: chartData.value,
        chartType: chartType.value,
        chartWidth: chartWidth.value,
        chartHeight: chartHeight.value,
        scrollWindow: scrollWindow.value,
        showAnnotations: showAnnotations.value,
        stacked: stacked.value,
        tooltipState: tooltipState.value,
        tooltipTitle: tooltipTitle?.value,
        tooltipMetricDisplay: tooltipMetricDisplay?.value,
        metricAxisTitle: metricAxisTitle?.value,
        dimensionAxisTitle: dimensionAxisTitle?.value,
        selectedLabels: selectedLabels.value,
        formatValue: (value: number) => formatUnit(value, metricUnit.value, { translateUnit }),
        chartTooltipSortFn: chartTooltipSortFn?.value,
      })
    } catch (err) {
      console.error(err)

      return {}
    }
  })

  return { option }
}

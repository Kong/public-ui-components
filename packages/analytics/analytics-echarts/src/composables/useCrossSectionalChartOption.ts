import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { ChartTooltipSortFn, KChartData, TooltipState } from '../types'
import type { StoredChartScrollWindow } from '../utils'

import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import { buildCrossSectionOption } from '../utils'
import composables from '.'

export default function useCrossSectionalChartOption({
  chartData,
  chartType,
  chartWidth,
  chartHeight,
  scrollWindow,
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
  scrollWindow: Ref<StoredChartScrollWindow | null>
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

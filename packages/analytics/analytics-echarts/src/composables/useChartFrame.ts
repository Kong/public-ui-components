import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { computed, useTemplateRef, type Ref } from 'vue'
import { useElementBounding, useElementSize } from '@vueuse/core'
import type {
  ChartLegendItem,
  ChartLegendSortFn,
  ChartTooltipSortFn,
  KChartData,
  LegendPosition,
} from '../types'
import { createDefaultChartLegendSort, createDefaultChartTooltipSort } from '../utils'
import useChartLegendValues from './useChartLegendValues'
import useI18n from './useI18n'

export interface UseChartFrameOptions {
  data: Readonly<Ref<ExploreResultV4>>
  chartData: Readonly<Ref<KChartData>>
  metricUnit: Readonly<Ref<string>>
  selectedLabels: Readonly<Ref<Record<string, boolean>>>
  legendPosition: Readonly<Ref<LegendPosition | undefined>>
  chartLegendSortFn: Readonly<Ref<ChartLegendSortFn | undefined>>
  chartTooltipSortFn: Readonly<Ref<ChartTooltipSortFn | undefined>>
  hideTruncationWarning: Readonly<Ref<boolean | undefined>>
}

type BaseChartRef = {
  getChart: () => { $el?: HTMLElement } | undefined
  getContainer: () => HTMLElement | undefined
}

type TooltipRef = {
  width?: number
  height?: number
}

export default function useChartFrame(options: UseChartFrameOptions) {
  const {
    data,
    chartData,
    metricUnit,
    selectedLabels,
    legendPosition,
    chartLegendSortFn,
    chartTooltipSortFn,
    hideTruncationWarning,
  } = options

  const { i18n } = useI18n()

  const baseChartRef = useTemplateRef<BaseChartRef>('baseChart')
  const tooltipRef = useTemplateRef<TooltipRef>('tooltip')

  const chartRef = computed(() => baseChartRef.value?.getChart())
  const containerRef = computed(() => baseChartRef.value?.getContainer())
  const chartEl = computed(() => chartRef.value?.$el as HTMLElement | undefined)

  const { width: chartWidth, height: chartHeight } = useElementSize(chartEl)
  const { top: containerTop, left: containerLeft } = useElementBounding(containerRef)

  const tooltipWidth = computed(() => tooltipRef.value?.width)
  const tooltipHeight = computed(() => tooltipRef.value?.height)

  const defaultLegendSort = computed(() => createDefaultChartLegendSort(i18n.t('chartLabels.____OTHER____')))
  const defaultTooltipSort = computed(() => createDefaultChartTooltipSort(i18n.t('chartLabels.____OTHER____')))
  const resolvedChartLegendSortFn = computed(() => chartLegendSortFn.value || defaultLegendSort.value)
  const resolvedChartTooltipSortFn = computed(() => chartTooltipSortFn.value || defaultTooltipSort.value)

  const { legendValues } = useChartLegendValues(chartData, metricUnit)

  const chartFlexClass = computed(() => {
    return legendPosition.value === 'bottom' ? 'column' : undefined
  })

  const legendItems = computed<ChartLegendItem[]>(() => {
    return chartData.value.datasets.map(dataset => ({
      label: dataset.label || '',
      color: dataset.backgroundColor || dataset.borderColor || '#000',
      borderColor: dataset.borderColor || dataset.backgroundColor || '#000',
      value: legendValues.value[dataset.label || ''],
      isSegmentEmpty: dataset.isSegmentEmpty,
      hidden: selectedLabels.value[dataset.label || ''] === false,
    })).sort(resolvedChartLegendSortFn.value)
  })

  const maxEntitiesShown = computed(() => data.value.meta?.limit?.toString() || null)
  const resultSetTruncated = computed(() => {
    return hideTruncationWarning.value ? false : data.value.meta?.truncated || false
  })

  return {
    baseChartRef,
    tooltipRef,
    chartRef,
    containerRef,
    chartEl,
    chartWidth,
    chartHeight,
    containerTop,
    containerLeft,
    tooltipWidth,
    tooltipHeight,
    chartFlexClass,
    chartLegendSortFn: resolvedChartLegendSortFn,
    chartTooltipSortFn: resolvedChartTooltipSortFn,
    legendItems,
    maxEntitiesShown,
    resultSetTruncated,
  }
}

import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import type { SeriesOption } from 'echarts'
import type { AnalyticsExploreRecord, CountryISOA2, ExploreResultV4, ReportChartTypes } from '@kong-ui-public/analytics-utilities'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import {
  datavisPalette,
  determineBaseColor,
} from '../utils'
import composables from '.'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { TooltipState } from 'src/components/ChartTooltip.vue'

type DatasetLabel = { id: string, name: string }

export default function useExploreResultToEChartCrossSectional({
  exploreResult,
  chartType,
  tooltipState,
  stacked = ref(true),
  colorPalette = ref(datavisPalette),
}: {
  exploreResult: Ref<ExploreResultV4>
  chartType: Ref<ReportChartTypes>
  tooltipState: Ref<TooltipState>
  stacked?: Ref<boolean>
  colorPalette?: Ref<string[] | Record<string, string> | undefined>
}) {
  const { i18n } = composables.useI18n()

  const option = computed<ECBasicOption>(() => {
    try {
      if (!exploreResult.value || !('meta' in exploreResult.value) || !('data' in exploreResult.value)) {
        return {}
      }

      const records = exploreResult.value.data as AnalyticsExploreRecord[]
      const { display, metric_names: metricNames } = exploreResult.value.meta

      const dimensionKeys = display && Object.keys(display)
      const isMultiMetric = metricNames && metricNames.length > 1
      const hasDimensions = display && dimensionKeys && dimensionKeys.length > 0

      if (!records.length || !metricNames) {
        return { series: [], xAxis: {}, yAxis: {} }
      }

      const dimensionFieldNames = (hasDimensions && dimensionKeys) || metricNames
      const primaryDimension = dimensionFieldNames[0]
      const secondaryDimension = (dimensionFieldNames.length > 1 ? dimensionFieldNames[1] : dimensionFieldNames[0])

      const pivotRecords = isMultiMetric
        ? Object.fromEntries(records.flatMap(e => {
          return metricNames.map((metric, i) => {
            const dimensionValue = e.event[primaryDimension]
            const label = hasDimensions ? `${dimensionValue},${metric}` : `${i},${metric}`
            const value = e.event[metric]
            return [label, value]
          })
        }))
        : Object.fromEntries(records.map(e => {
          const label = hasDimensions
            ? `${e.event[primaryDimension]},${e.event[secondaryDimension]}`
            : `${primaryDimension},${secondaryDimension}`
          const value = e.event[metricNames[0]]

          return [label, value]
        }))

      const aggregatedPivotRecords = Object.keys(pivotRecords).reduce((acc, key) => {
        const [row] = key.split(',')
        const pivotEntry = pivotRecords[key] as number

        if (acc[row]) {
          acc[row] += pivotEntry
        } else {
          acc[row] = pivotEntry
        }
        return acc
      }, {} as Record<string, number>)

      const sortedDatasetIds = Object.entries(aggregatedPivotRecords)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .map(([key]) => key)

      const primaryDimensionDisplay = display[primaryDimension]
      const secondaryDimensionDisplay = display[secondaryDimension]

      let rowLabels: DatasetLabel[] = (hasDimensions && primaryDimensionDisplay &&
        Object.entries(primaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) ||
        metricNames.map(name => ({ id: name, name }))

      let barSegmentLabels: DatasetLabel[] = (hasDimensions && secondaryDimensionDisplay &&
        Object.entries(secondaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) ||
        metricNames.map(name => ({ id: name, name }))

      // Handle country code translations
      if (hasDimensions && primaryDimension === 'country_code') {
        rowLabels = rowLabels.map(label => ({
          ...label,
          name: getCountryName(label.id as CountryISOA2) || label.name,
        }))
      }

      if (hasDimensions && secondaryDimension === 'country_code') {
        barSegmentLabels = barSegmentLabels.map(label => ({
          ...label,
          name: getCountryName(label.id as CountryISOA2) || label.name,
        }))
      }

      // Sort labels
      if (primaryDimension !== 'status_code' && primaryDimension !== 'status_code_grouped') {
        rowLabels.sort((a, b) => sortedDatasetIds.indexOf(a.id) - sortedDatasetIds.indexOf(b.id))
        barSegmentLabels.sort((a, b) => sortedDatasetIds.indexOf(a.id) - sortedDatasetIds.indexOf(b.id))
      }

      if (!rowLabels || !barSegmentLabels) {
        return { series: [], xAxis: {}, yAxis: {} }
      }

      // Generate series based on chart type
      if (chartType.value === 'donut') {
        // For donut charts, aggregate all data into a single series
        const donutData = rowLabels.map((label, i) => {
          const total = barSegmentLabels.reduce((sum, segment) => {
            const value = hasDimensions
              ? pivotRecords[`${label.id},${segment.id}`]
              : pivotRecords[`${i},${segment.id}`]
            return sum + (Number(value) || 0)
          }, 0)

          const baseColor = determineBaseColor(i, label.name, label.id === 'empty',
            Array.isArray(colorPalette) ? colorPalette : datavisPalette)

          return {
            name: (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${label.name}` as any))
              ? i18n.t(`chartLabels.${label.name}` as any)
              : label.name,
            value: total,
            itemStyle: { color: baseColor },
          }
        })

        const series: SeriesOption[] = [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: donutData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        }]

        return {
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              tooltipState.value.entries = [{
                label: params.name,
                value: params.value,
                backgroundColor: params.color,
                borderColor: params.color,
                rawValue: 0,
              }]
              tooltipState.value.visible = true
              tooltipState.value.subtitle = `${params.percent}%`
              return undefined
            },
          },
          legend: {
            type: 'scroll',
            bottom: 0,
            left: 'center',
          },
          series,
        } as ECBasicOption
      }

      // For bar charts (horizontal and vertical)
      const series: SeriesOption[] = isMultiMetric
        ? metricNames.map((metric, i) => {
          const data = rowLabels.map((rowPosition, idx) => {
            return hasDimensions
              ? pivotRecords[`${rowPosition.id},${metric}`] || 0
              : pivotRecords[`${idx},${metric}`] || null
          })

          const baseColor = determineBaseColor(i, metric, false,
            Array.isArray(colorPalette) ? colorPalette : datavisPalette)

          return {
            name: (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${metric}` as any))
              ? i18n.t(`chartLabels.${metric}` as any)
              : metric,
            type: 'bar',
            data,
            itemStyle: { color: baseColor },
            stack: stacked.value ? 'total' : undefined,
            label: {
              show: true,
              position: stacked.value ? 'inside' : 'top',
              formatter: '{c}',
            },
            selectedMode: 'single', // or 'multiple' if you want multi-select
            select: {
              itemStyle: {
                borderColor: '#000',
                borderWidth: 3,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            emphasis: {
              focus: 'self',
              itemStyle: {
                borderColor: '#000',
                borderWidth: 2,
              },
            },
          } as SeriesOption
        })
        : barSegmentLabels.map((dimension, i) => {
          if (!dimension) return null

          const baseColor = determineBaseColor(i, dimension.name, dimension.id === 'empty',
            Array.isArray(colorPalette) ? colorPalette : datavisPalette)

          const data = rowLabels.map(rowPosition => {
            return pivotRecords[`${rowPosition.id},${dimension.id}`] || null
          })

          return {
            name: (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${dimension.name}` as any))
              ? i18n.t(`chartLabels.${dimension.name}` as any)
              : dimension.name,
            type: 'bar',
            data,
            itemStyle: { color: baseColor },
            stack: stacked.value ? 'total' : undefined,
            isSegmentEmpty: dimension.id === 'empty',
            label: {
              show: true,
              position: 'top',
              formatter: '{c} requests',
            },
            selectedMode: 'single', // or 'multiple' if you want multi-select
            select: {
              itemStyle: {
                borderColor: '#000',
                borderWidth: 3,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
            emphasis: {
              focus: 'self',
              itemStyle: {
                borderColor: '#000',
                borderWidth: 2,
              },
            },
          } as SeriesOption
        }).filter((series): series is SeriesOption => series !== null)

      const labels = !hasDimensions
        ? metricNames.map(name => (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${name}` as any))
          ? i18n.t(`chartLabels.${name}` as any)
          : name)
        : rowLabels.map(label => (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${label.name}` as any))
          ? i18n.t(`chartLabels.${label.name}` as any)
          : label.name)

      const isHorizontal = chartType.value === 'horizontal_bar'

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            // Filter out null/undefined values and entries with no data
            const validParams = params.filter((param: any) =>
              param.value !== null &&
              param.value !== undefined &&
              param.value !== 0,
            )

            if (validParams.length === 0) {
              return undefined
            }

            tooltipState.value.entries = validParams.map((param: any) => ({
              label: param.seriesName,
              value: param.value,
              backgroundColor: param.color,
              borderColor: param.color,
              rawValue: param.value,
            }))
            tooltipState.value.visible = true
            tooltipState.value.subtitle = params[0]?.axisValueLabel
            return undefined
          },
        },
        legend: {
          type: 'scroll',
          bottom: 0,
          left: 'center',
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '50px',
          top: '25px',
          containLabel: true,
        },
        xAxis: isHorizontal
          ? {
            type: 'value',
            axisLine: { show: true },
          }
          : {
            type: 'category',
            data: labels,
            axisLine: { show: true },
          },
        yAxis: isHorizontal
          ? {
            type: 'category',
            data: labels,
            axisLine: { show: true },
          }
          : {
            type: 'value',
            axisLine: { show: true },
          },
        series,
      } as ECBasicOption
    } catch (err) {
      console.error(err)
      return {}
    }
  })

  // Add metadata similar to useExploreResultToDatasets
  const isMultiDimension = computed(() => {
    if (!exploreResult.value || !('meta' in exploreResult.value)) {
      return false
    }

    const { display } = exploreResult.value.meta
    const dimensionKeys = display && Object.keys(display)
    const hasDimensions = display && dimensionKeys && dimensionKeys.length > 0

    return hasDimensions && dimensionKeys.length > 1
  })

  const isLabelEmpty = computed(() => {
    if (!exploreResult.value || !('meta' in exploreResult.value)) {
      return []
    }

    const { display, metric_names: metricNames } = exploreResult.value.meta
    const dimensionKeys = display && Object.keys(display)
    const hasDimensions = display && dimensionKeys && dimensionKeys.length > 0

    if (!hasDimensions) {
      return []
    }

    const primaryDimension = dimensionKeys[0]
    const primaryDimensionDisplay = display[primaryDimension]

    const rowLabels = (primaryDimensionDisplay &&
      Object.entries(primaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) ||
      metricNames?.map(name => ({ id: name, name })) || []

    return rowLabels.map(rowPosition => rowPosition.id === 'empty')
  })

  return {
    option,
    isMultiDimension,
    isLabelEmpty,
  }
}

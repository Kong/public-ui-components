import type { AnalyticsExploreRecord, CountryISOA2, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { Ref } from 'vue'
import { DIMENSION_COUNTRY_CODE, EMPTY_SEGMENT_ID, STATUS_CODE_DIMENSIONS } from '../types'
import type { AnalyticsChartColors, Dataset, DatasetLabel, KChartData } from '../types'

import { computed, unref } from 'vue'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import { defaultStatusCodeColors, determineBaseColor } from '../utils'
import { translateChartLabel } from '../utils/chart-labels'
import useI18n from './useI18n'

const generateDatasets = ({
  isMultiMetric,
  hasDimensions,
  metricNames,
  barSegmentLabels,
  pivotRecords,
  rowLabels,
  colorPalette,
}: {
  isMultiMetric: boolean
  hasDimensions: boolean
  metricNames: string[]
  barSegmentLabels: DatasetLabel[]
  pivotRecords: Record<string, number>
  rowLabels: DatasetLabel[]
  colorPalette: AnalyticsChartColors | string[]
}): Dataset[] => {
  const { i18n } = useI18n()

  if (isMultiMetric) {
    return metricNames.map((metric, metricIndex): Dataset => ({
      rawMetric: metric,
      rawDimension: metric,
      label: translateChartLabel(i18n, metric),
      backgroundColor: determineBaseColor(metricIndex, metric, false, colorPalette),
      borderColor: determineBaseColor(metricIndex, metric, false, colorPalette),
      data: rowLabels.map((rowPosition, index): number => {
        return hasDimensions ? pivotRecords[`${rowPosition.id},${metric}`] || 0 : pivotRecords[`${index},${metric}`] || 0
      }),
    }))
  }

  return barSegmentLabels.flatMap((dimension, dimensionIndex) => {
    if (!dimension) {
      return []
    }

    const baseColor = determineBaseColor(dimensionIndex, dimension.name, dimension.id === EMPTY_SEGMENT_ID, colorPalette)

    return {
      rawMetric: metricNames[0],
      rawDimension: dimension.name,
      label: translateChartLabel(i18n, dimension.name),
      backgroundColor: baseColor,
      borderColor: baseColor,
      data: rowLabels.map(rowPosition => pivotRecords[`${rowPosition.id},${dimension.id}`] || 0),
      isSegmentEmpty: dimension.id === EMPTY_SEGMENT_ID,
    } satisfies Dataset
  })
}

const applyCountryNames = (dimension: string, labels: DatasetLabel[]): DatasetLabel[] => {
  if (dimension !== DIMENSION_COUNTRY_CODE) {
    return labels
  }

  return labels.map(label => ({
    ...label,
    name: getCountryName(label.id as CountryISOA2) || label.name,
  }))
}

const getDimensionLabels = ({
  hasDimensions,
  dimension,
  dimensionDisplay,
  metricNames,
}: {
  hasDimensions: boolean
  dimension: string
  dimensionDisplay: ExploreResultV4['meta']['display'][string] | undefined
  metricNames: string[]
}) => {
  const labels: DatasetLabel[] = (hasDimensions && dimensionDisplay &&
    Object.entries(dimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) ||
    metricNames.map(name => ({ id: name, name }))

  return applyCountryNames(dimension, labels)
}

const buildPivotRecords = ({
  records,
  metricNames,
  isMultiMetric,
  hasDimensions,
  primaryDimension,
  secondaryDimension,
  getPrimaryDimensionId,
}: {
  records: AnalyticsExploreRecord[]
  metricNames: string[]
  isMultiMetric: boolean
  hasDimensions: boolean
  primaryDimension: string
  secondaryDimension: string
  getPrimaryDimensionId: (record: AnalyticsExploreRecord) => string
}) => {
  return isMultiMetric
    ? Object.fromEntries(records.flatMap(record => {
      return metricNames.map((metric, index) => {
        const dimensionValue = getPrimaryDimensionId(record)
        const label = hasDimensions ? `${dimensionValue},${metric}` : `${index},${metric}`
        const value = Number(record.event[metric]) || 0

        return [label, value]
      })
    }))
    : Object.fromEntries(records.map(record => {
      const label = hasDimensions
        ? `${record.event[primaryDimension]},${record.event[secondaryDimension]}`
        : `${primaryDimension},${secondaryDimension}`

      return [label, Number(record.event[metricNames[0]]) || 0]
    }))
}

const aggregatePivotRecords = ({
  records,
  metricNames,
  isMultiMetric,
  getPrimaryDimensionId,
}: {
  records: AnalyticsExploreRecord[]
  metricNames: string[]
  isMultiMetric: boolean
  getPrimaryDimensionId: (record: AnalyticsExploreRecord) => string
}) => {
  return records.reduce((acc, record) => {
    const row = getPrimaryDimensionId(record)
    const pivotEntry = isMultiMetric
      ? metricNames.reduce((sum, metric) => sum + (Number(record.event[metric]) || 0), 0)
      : Number(record.event[metricNames[0]]) || 0

    acc[row] = (acc[row] || 0) + pivotEntry

    return acc
  }, {} as Record<string, number>)
}

const sortLabelsByTotals = ({
  rowLabels,
  totals,
  primaryDimension,
  hasDimensions,
}: {
  rowLabels: DatasetLabel[]
  totals: Record<string, number>
  primaryDimension: string
  hasDimensions: boolean
}) => {
  const sortedDatasetIds = Object.entries(totals)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([key]) => key)
  const sortOrder = new Map(sortedDatasetIds.map((id, i) => [id, i]))
  const bySortOrder = (a: DatasetLabel, b: DatasetLabel) => (sortOrder.get(a.id) ?? Infinity) - (sortOrder.get(b.id) ?? Infinity)
  const preserveLexicalRowOrder = hasDimensions && STATUS_CODE_DIMENSIONS.includes(primaryDimension as typeof STATUS_CODE_DIMENSIONS[number])

  if (!preserveLexicalRowOrder) {
    rowLabels.sort(bySortOrder)
  }

  return preserveLexicalRowOrder
}

export default function useCrossSectionalChartData(
  {
    colorPalette = defaultStatusCodeColors,
  }: {
    colorPalette?: AnalyticsChartColors | string[] | Ref<AnalyticsChartColors | string[]>
  },
  exploreResult: Ref<ExploreResultV4>,
): Ref<KChartData> {
  const { i18n } = useI18n()

  return computed<KChartData>(() => {
    try {
      if (!exploreResult.value || !('meta' in exploreResult.value) || !('data' in exploreResult.value)) {
        return { datasets: [], labels: [] }
      }

      const records = exploreResult.value.data as AnalyticsExploreRecord[]
      const { display, metric_names: metricNames } = exploreResult.value.meta

      const dimensionKeys = display && Object.keys(display)
      const isMultiMetric = !!(metricNames && metricNames.length > 1)
      const hasDimensions = !!(display && dimensionKeys && dimensionKeys.length > 0)
      const isMultiDimension = !!(hasDimensions && dimensionKeys.length > 1)

      if (!records.length || !metricNames) {
        return { datasets: [], labels: [] }
      }

      const dimensionFieldNames = (hasDimensions && dimensionKeys) || metricNames
      const primaryDimension = dimensionFieldNames[0]
      const secondaryDimension = dimensionFieldNames.length > 1 ? dimensionFieldNames[1] : dimensionFieldNames[0]
      const getPrimaryDimensionId = (record: AnalyticsExploreRecord) => String(record.event[primaryDimension])

      const pivotRecords = buildPivotRecords({
        records,
        metricNames,
        isMultiMetric,
        hasDimensions,
        primaryDimension,
        secondaryDimension,
        getPrimaryDimensionId,
      })
      const aggregatedPivotRecords = aggregatePivotRecords({
        records,
        metricNames,
        isMultiMetric,
        getPrimaryDimensionId,
      })

      const primaryDimensionDisplay = display?.[primaryDimension]
      const secondaryDimensionDisplay = display?.[secondaryDimension]

      const rowLabels = getDimensionLabels({
        hasDimensions,
        dimension: primaryDimension,
        dimensionDisplay: primaryDimensionDisplay,
        metricNames,
      })
      const barSegmentLabels = getDimensionLabels({
        hasDimensions,
        dimension: secondaryDimension,
        dimensionDisplay: secondaryDimensionDisplay,
        metricNames,
      })
      const preserveLexicalRowOrder = sortLabelsByTotals({
        rowLabels,
        totals: aggregatedPivotRecords,
        primaryDimension,
        hasDimensions,
      })

      const datasets = generateDatasets({
        isMultiMetric,
        hasDimensions,
        metricNames,
        barSegmentLabels,
        pivotRecords,
        rowLabels,
        colorPalette: unref(colorPalette),
      }).map((dataset): Dataset => {
        const total = (dataset.data as number[]).reduce((acc, value) => acc + Number(value), 0)

        return {
          ...dataset,
          total,
        }
      })

      if (!preserveLexicalRowOrder) {
        datasets.sort((a, b) => Number(b.total) - Number(a.total))
      }

      const labels = !hasDimensions
        ? metricNames.map(name => translateChartLabel(i18n, name))
        : rowLabels.map(label => translateChartLabel(i18n, label.name))

      const isLabelEmpty = rowLabels.map(rowPosition => rowPosition.id === 'empty')

      return {
        labels,
        datasets,
        isLabelEmpty,
        isMultiDimension,
      }
    } catch (err) {
      console.error(err)

      return { datasets: [], labels: [] }
    }
  })
}

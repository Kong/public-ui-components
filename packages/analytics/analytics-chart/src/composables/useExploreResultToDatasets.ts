import type { AnalyticsExploreRecord, CountryISOA2, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { Ref } from 'vue'
import type { Dataset, ExploreToDatasetDeps, KChartData, BarChartDatasetGenerationParams, DatasetLabel } from '../types'

import { computed } from 'vue'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import { lookupDatavisColor, datavisPalette, determineBaseColor } from '../utils'
import composables from '../composables'

function generateDatasets(dataSetGenerationParams: BarChartDatasetGenerationParams): Dataset[] {
  const {
    isMultiMetric,
    hasDimensions,
    metricNames,
    barSegmentLabels,
    pivotRecords,
    rowLabels,
    colorPalette,
  } = dataSetGenerationParams
  const { i18n } = composables.useI18n()

  if (isMultiMetric) {
    return metricNames.map((metric) => {
      return {
        // @ts-ignore - dynamic i18n key
        label: (i18n && i18n.te(`chartLabels.${metric}`) && i18n.t(`chartLabels.${metric}`)) || metric,
        backgroundColor: lookupDatavisColor(metricNames.indexOf(metric), datavisPalette),
        data: rowLabels.map((rowPosition, i) => {
          return hasDimensions ? pivotRecords[`${rowPosition.id},${metric}`] || 0 : pivotRecords[`${i},${metric}`] || null
        }),
      } as Dataset
    })
  }

  const datasets = Array.from(barSegmentLabels).flatMap((dimension, i) => {
    if (!dimension) {
      return []
    }

    const baseColor = determineBaseColor(i, dimension.name, dimension.id === 'empty', colorPalette)

    // The label here matters for the title in the tooltip and legend.  It doesn't impact axes.
    return {
      // Note: there's a bug here; if an entity name overlaps with a dimension name, it'll get translated.
      // @ts-ignore - dynamic i18n key
      label: (i18n && i18n.te(`chartLabels.${dimension.name}`) && i18n.t(`chartLabels.${dimension.name}`)) || dimension.name,
      backgroundColor: baseColor,
      data: rowLabels.map(rowPosition => {
        return pivotRecords[`${rowPosition.id},${dimension.id}`] || null
      }),
      isSegmentEmpty: dimension.id === 'empty',
    } as Dataset
  })

  return datasets
}

export default function useExploreResultToDatasets(
  deps: ExploreToDatasetDeps,
  exploreResult: Ref<ExploreResultV4>,
): Ref<KChartData> {

  const { i18n } = composables.useI18n()
  const chartData: Ref<KChartData> = computed(() => {

    try {
      if (exploreResult.value && 'meta' in exploreResult.value && 'data' in exploreResult.value) {
        const records = exploreResult.value.data as AnalyticsExploreRecord[]
        const { display, metric_names: metricNames } = exploreResult.value.meta

        const dimensionKeys = display && Object.keys(display)
        const isMultiMetric = metricNames && metricNames.length > 1
        const hasDimensions = display && dimensionKeys && dimensionKeys.length > 0
        const isMultiDimension = hasDimensions && dimensionKeys.length > 1

        if (!records.length || !metricNames) {
          return { datasets: [], labels: [] }
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
        const sortedDatasetIds = Object.entries(aggregatedPivotRecords).sort(([, a], [, b]) => Number(b) - Number(a)).map(([key]) => key)
        const primaryDimensionDisplay = display[primaryDimension]
        const secondaryDimensionDisplay = display[secondaryDimension]

        let rowLabels: DatasetLabel[] = (hasDimensions && primaryDimensionDisplay && Object.entries(primaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) || metricNames.map(name => ({ id: name, name }))
        let barSegmentLabels: DatasetLabel[] = (hasDimensions && secondaryDimensionDisplay && Object.entries(secondaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) || metricNames.map(name => ({ id: name, name }))

        // If the primary or secondary dimension is a country_code, get the country's display name
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
        if (primaryDimension !== 'status_code' && primaryDimension !== 'status_code_grouped') {
          rowLabels.sort((a, b) => sortedDatasetIds.indexOf(a.id) - sortedDatasetIds.indexOf(b.id))
          barSegmentLabels.sort((a, b) => sortedDatasetIds.indexOf(a.id) - sortedDatasetIds.indexOf(b.id))
        }

        if (!rowLabels || !barSegmentLabels) {
          return { labels: [], datasets: [] }
        }

        const datasets = generateDatasets({
          isMultiMetric,
          hasDimensions,
          metricNames,
          dimensionFieldNames,
          barSegmentLabels,
          pivotRecords,
          rowLabels,
          colorPalette: deps.colorPalette || datavisPalette,
        })

        // The labels here are for the axes.  They don't impact the tooltip or legend.
        const labels = !hasDimensions
          // @ts-ignore - dynamic i18n key
          ? metricNames.map(name => (i18n && i18n.te(`chartLabels.${name}`) && i18n.t(`chartLabels.${name}`)) || name)
          // @ts-ignore - dynamic i18n key
          : rowLabels.map(label => (i18n && i18n.te(`chartLabels.${label.name}`) && i18n.t(`chartLabels.${label.name}`)) || label.name)

        const isLabelEmpty = rowLabels.map(rowPosition => rowPosition.id === 'empty')

        const data: KChartData = {
          labels,
          datasets,
          isLabelEmpty,
          isMultiDimension,
        }

        return data
      }
    } catch (err) {
      console.error(err)

      return { datasets: [], labels: [] }
    }

    return { labels: [], datasets: [] }
  })

  return chartData
}

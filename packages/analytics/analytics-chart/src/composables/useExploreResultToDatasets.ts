import type { AnalyticsExploreRecord, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { lookupDatavisColor, datavisPalette } from '../utils'
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { Dataset, ExploreToDatasetDeps, KChartData, BarChartDatasetGenerationParams, DatasetLabel } from '../types'
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

  return Array.from(barSegmentLabels).flatMap((dimension, i) => {
    if (!dimension) {
      return []
    }

    const colorMap: { [label: string]: string } = {}

    const baseColor = Array.isArray(colorPalette)
      ? lookupDatavisColor(i, colorPalette)
      : colorPalette[dimension.name] || lookupDatavisColor(i) // fallback to default datavis palette if no color found

    colorMap[dimension.name] = baseColor

    return {
      // @ts-ignore - dynamic i18n key
      label: (i18n && i18n.te(`chartLabels.${dimension.name}`) && i18n.t(`chartLabels.${dimension.name}`)) || dimension.name,
      backgroundColor: baseColor,
      data: rowLabels.map(rowPosition => {
        return pivotRecords[`${rowPosition.id},${dimension.id}`] || null
      }),
    } as Dataset
  })
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

        const primaryDimensionDisplay = display[primaryDimension]
        const secondaryDimensionDisplay = display[secondaryDimension]
        const rowLabels: DatasetLabel[] = (hasDimensions && primaryDimensionDisplay && Object.entries(primaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) || metricNames.map(name => ({ id: name, name }))

        const barSegmentLabels: DatasetLabel[] = (hasDimensions && secondaryDimensionDisplay && Object.entries(secondaryDimensionDisplay).map(([id, val]) => ({ id, name: val.name }))) || metricNames.map(name => ({ id: name, name }))

        if (!rowLabels || !barSegmentLabels) {
          return { labels: [], datasets: [] }
        }

        const data: KChartData = {
          labels: !hasDimensions
            // @ts-ignore - dynamic i18n key
            ? metricNames.map(name => (i18n && i18n.te(`chartLabels.${name}`) && i18n.t(`chartLabels.${name}`)) || name)
            // @ts-ignore - dynamic i18n key
            : Object.entries(display[primaryDimension]).map(([, val]) => (i18n && i18n.te(`chartLabels.${val.name}`) && i18n.t(`chartLabels.${val.name}`)) || val.name),
          datasets: generateDatasets({
            isMultiMetric,
            hasDimensions,
            metricNames,
            dimensionFieldNames,
            barSegmentLabels,
            pivotRecords,
            rowLabels,
            colorPalette: deps.colorPalette || datavisPalette,
          }),
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

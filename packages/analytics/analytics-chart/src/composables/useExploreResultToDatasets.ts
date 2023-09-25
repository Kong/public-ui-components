import type { AnalyticsExploreResult, AnalyticsExploreV2Result, AnalyticsExploreRecord } from '@kong-ui-public/analytics-utilities'
import { lookupDatavisColor, datavisPalette } from '../utils'
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { Dataset, ExploreToDatasetDeps, KChartData } from '../types'
import { isNullOrUndef } from 'chart.js/helpers'
import composables from '../composables'

export default function useExploreResultToDatasets(
  deps: ExploreToDatasetDeps,
  exploreResult: Ref<AnalyticsExploreV2Result | AnalyticsExploreResult>,
): Ref<KChartData> {

  const { i18n } = composables.useI18n()

  const chartData: Ref<KChartData> = computed(() => {

    try {
      if (exploreResult.value && 'meta' in exploreResult.value && 'records' in exploreResult.value) {
        const records = exploreResult.value.records as AnalyticsExploreRecord[]
        const { dimensions, metricNames } = exploreResult.value.meta

        const dimensionKeys = dimensions && Object.keys(dimensions)

        const isMultiMetric = metricNames && metricNames.length > 1

        // TODO: remove "Organization" fallback when we are fully migrated to explore v2
        const hasDimensions = dimensions && dimensionKeys && (
          dimensionKeys.length === 1
            ? dimensionKeys[0] !== 'Organization'
            : dimensionKeys.length > 0
        )

        if (!records.length || !metricNames) {
          return { datasets: [], labels: [] }
        }

        const dimensionFieldNames = (hasDimensions && dimensionKeys) || metricNames
        const primaryDimension = dimensionFieldNames[0]
        const secondaryDimension = dimensionFieldNames.length > 1 ? dimensionFieldNames[1] : dimensionFieldNames[0]

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

        const rowLabels: string[] = (hasDimensions && dimensions[primaryDimension]) || metricNames

        const barSegmentLabels: string[] = (hasDimensions && dimensions[secondaryDimension]) || metricNames

        if (!rowLabels || !barSegmentLabels) {
          return { labels: [], datasets: [] }
        }

        const data: KChartData = {
          labels: !hasDimensions
            // @ts-ignore - dynamic i18n key
            ? metricNames.map(name => (i18n && i18n.te(`chartLabels.${name}`) && i18n.t(`chartLabels.${name}`)) || name)
            // @ts-ignore - dynamic i18n key
            : dimensions[primaryDimension].map(name => (i18n && i18n.te(`chartLabels.${name}`) && i18n.t(`chartLabels.${name}`)) || name),
          datasets: isMultiMetric
            ? metricNames.map((metric) => {
              return {
                // @ts-ignore - dynamic i18n key
                label: (i18n && i18n.te(`chartLabels.${metric}`) && i18n.t(`chartLabels.${metric}`)) || metric,
                backgroundColor: lookupDatavisColor(metricNames.indexOf(metric), datavisPalette),
                data: rowLabels.map((rowPosition, i) => {
                  return hasDimensions ? pivotRecords[`${rowPosition},${metric}`] || 0 : pivotRecords[`${i},${metric}`] || 0
                }),
              } as Dataset
            })
            : barSegmentLabels && Array.from(barSegmentLabels).flatMap((dimension, i) => {
              if (!dimension) {
                return []
              }

              let { colorPalette } = deps
              if (isNullOrUndef(colorPalette)) {
                colorPalette = datavisPalette
              }
              const colorMap: { [label: string]: string } = {}

              const baseColor = Array.isArray(colorPalette)
                ? lookupDatavisColor(i, colorPalette)
                : colorPalette[dimension] || lookupDatavisColor(i) // fallback to default datavis palette if no color found

              colorMap[dimension] = baseColor

              return {
              // @ts-ignore - dynamic i18n key
                label: (i18n && i18n.te(`chartLabels.${dimension}`) && i18n.t(`chartLabels.${dimension}`)) || dimension,
                backgroundColor: baseColor,
                data: rowLabels.map(rowPosition => {
                  return pivotRecords[`${rowPosition},${dimension}`] || 0
                }),
              } as Dataset
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

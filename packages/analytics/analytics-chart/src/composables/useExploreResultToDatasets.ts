import { AnalyticsExploreResult, AnalyticsExploreV2Result, AnalyticsExploreRecord } from '@kong-ui-public/analytics-utilities'
import { lookupDatavisColor, datavisPalette } from '../utils'
import { computed, Ref } from 'vue'
import { Dataset, ExploreToDatasetDeps, KChartData } from '../types'
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
        const metric = metricNames[0]

        const pivotRecords = Object.fromEntries(records.map(e => {
          const label = hasDimensions
            ? `${e.event[primaryDimension]},${e.event[secondaryDimension]}`
            : `${primaryDimension},${secondaryDimension}`
          const value = e.event[metric]

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
          datasets: barSegmentLabels && Array.from(barSegmentLabels).flatMap((dimension, i) => {
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

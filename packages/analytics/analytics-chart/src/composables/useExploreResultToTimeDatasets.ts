import { AnalyticsExploreResult, AnalyticsExploreV2Result, AnalyticsExploreRecord } from '@kong-ui-public/analytics-utilities'
import { defaultLineOptions, darkenColor, lookupDatavisColor, datavisPalette } from '../utils'
import { computed, Ref } from 'vue'
import type { Dataset, KChartData, ExploreToDatasetDeps } from '../types'
import { parseISO } from 'date-fns'
import { isNullOrUndef } from 'chart.js/helpers'
import composables from '../composables'

const range = (start: number, stop: number, step: number = 1): number[] =>
  Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)

const originToOffset = (origin: string | number): number => {
  if (typeof origin === 'string') {
    const toNumber = +origin

    if (toNumber) {
      return toNumber
    }

    try {
      const parsedOrigin = parseISO(origin)

      return parsedOrigin.getTime()
    } catch (e) {
      if (e instanceof RangeError) {
        // Invalid date.
        return 0
      }

      // Don't squash other exceptions.
      throw e
    }
  }

  return origin
}

export const createZeroFilledTimeSeries = (startMs: number, endMs: number, stepMs: number, offsetMs: number, records: AnalyticsExploreRecord[]) => {
  // When creating the zero-filled time series, need to normalize
  // the start and end times in order for the datapoint timestamps
  // to match those coming from druid which are rounded to the
  // nearest step size
  const ZERO_FILL_PADDING = 60 * 1000 // now - 60 seconds
  const lastEndMs = Math.max(
    ((endMs) - ZERO_FILL_PADDING),
    Math.max(...(records || []).map(e => (new Date(e.timestamp).valueOf()))),
  )

  const roundedStart = Math.floor((startMs - offsetMs) / stepMs) * stepMs + offsetMs
  const roundedEnd = Math.floor((lastEndMs - offsetMs) / stepMs) * stepMs + offsetMs + stepMs

  return range(roundedStart, roundedEnd, stepMs)
}

export default function useExploreResultToTimeDataset(
  deps: ExploreToDatasetDeps,
  exploreResult: Ref<AnalyticsExploreV2Result | AnalyticsExploreResult>,
): Ref<KChartData> {
  const { i18n } = composables.useI18n()
  const chartData: Ref<KChartData> = computed(() => {

    try {
      if (exploreResult.value && 'meta' in exploreResult.value && 'records' in exploreResult.value) {
        const records = exploreResult.value.records as AnalyticsExploreRecord[]
        const { dimensions, metricNames } = exploreResult.value.meta

        const startMs = ('startMs' in exploreResult.value.meta) ? exploreResult.value.meta.startMs : exploreResult.value.meta.start * 1000
        const endMs = ('endMs' in exploreResult.value.meta) ? exploreResult.value.meta.endMs : exploreResult.value.meta.end * 1000

        if (!metricNames) {
          console.error('Cannot build chart data from this explore result. Missing metric names.')
          return { datasets: [] }
        }
        const dimensionFieldNames = (dimensions && Object.keys(dimensions)) || metricNames
        const metric = metricNames && metricNames[0]

        // Time based datasets can only display one "dimension"
        // It will either be the first dimension or if no dimensions
        // are provided, then the metric is the primary dimension
        const dimension = (dimensionFieldNames && dimensionFieldNames[0]) || metric
        const datasetLabels = (dimensions && (dimensions as {[label: string]: string[]})[dimension]) || metricNames

        // Bail out early if we can't handle the value of `step`.
        // Not sure when this happens, but it seems to at times in production.
        const stepMs = exploreResult.value.meta.granularity

        if (typeof stepMs !== 'number' || isNaN(stepMs) || !isFinite(stepMs) || stepMs === 0) {
          console.error('Invalid step value:', stepMs)

          return { datasets: [] }
        }

        if (!records.length) {
          return { datasets: [] }
        }

        const offsetMs = originToOffset(startMs)
        const zeroFilledTimeSeries = createZeroFilledTimeSeries(startMs, endMs, stepMs, offsetMs, records)
        const dimensionPositions = new Set<string>()

        const timedEvents = !records?.length
          ? {}
          : records.reduce((acc: {[label: string]: any}, druidRow) => {
            const timestamp: number = new Date(druidRow.timestamp).valueOf()
            const event = druidRow.event as {[label: string]: string | number}

            dimensionPositions.add(metric)
            if (!(timestamp in acc)) {
              acc[timestamp] = {}
            }

            if (!(metric in acc[timestamp])) {
              acc[timestamp][metric] = {}
            }

            datasetLabels.forEach((label: string) => {
              if (event[dimension] === label || dimension === label) {
                acc[timestamp][metric][label] = Math.round(Number(event[metric]) * 1e3) / 1e3
              } else if (!dimensionFieldNames.length) { // using metrics as dimensions
                acc[timestamp][metric][label] = Math.round(Number(event[label]) * 1e3) / 1e3
              }

            })

            return acc
          }, {})

        const dimensionsCrossMetrics = [...dimensionPositions].reduce((acc: string[][], position) => {
          datasetLabels.forEach((label: string) => acc.push([position, label]))

          return acc
        }, [])

        const colorMap: {[label: string]: string} = {}

        const datasets: Dataset[] = [...dimensionsCrossMetrics].map(([metric, dimension], i) => {
          const filled = zeroFilledTimeSeries.map(ts => {
            if (ts in timedEvents && metric in timedEvents[ts]) {
              return { x: ts, y: timedEvents[ts][metric][dimension] || 0 }
            }

            return { x: ts, y: 0 }
          })

          let { colorPalette, fill } = deps

          if (isNullOrUndef(colorPalette)) {
            colorPalette = datavisPalette
          }

          const baseColor = Array.isArray(colorPalette)
            ? lookupDatavisColor(i, colorPalette)
            : colorPalette[dimension] || lookupDatavisColor(i) // fallback to default datavis palette if no color found

          const borderColor = darkenColor(baseColor, 50)

          colorMap[dimension] = baseColor

          return {
            rawDimension: dimension,
            rawMetric: metric,
            // @ts-ignore - dynamic i18n key
            label: (i18n && i18n.te(`chartLabels.${dimension}`) && i18n.t(`chartLabels.${dimension}`)) || dimension,
            borderColor,
            backgroundColor: baseColor,
            data: filled,
            total: filled.reduce((acc, { y }) => acc + Number(y), 0),
            ...defaultLineOptions,
            fill,
          }
        })

        // Display largest dataset on top
        // sort by total, descending
        datasets.sort((a, b) => (Number(a.total) < Number(b.total) ? -1 : 1))

        return {
          datasets,
          colorMap,
        }
      }
    } catch (err) {
      console.error(err)

      return { labels: [], datasets: [] }
    }

    return { labels: [], datasets: [] }
  })

  return chartData
}

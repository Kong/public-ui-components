import type { AnalyticsExploreRecord, CountryISOA2, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { Ref } from 'vue'
import type { Dataset, KChartData, ExploreToDatasetDeps, DatasetLabel } from '../types'

import { computed } from 'vue'
import { isNullOrUndef } from 'chart.js/helpers'
import { parseISO } from 'date-fns'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import {
  defaultLineOptions,
  datavisPalette,
  BORDER_WIDTH,
  NO_BORDER,
  determineBaseColor,
} from '../utils'
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
  exploreResult: Ref<ExploreResultV4>,
): Ref<KChartData> {
  const { i18n } = composables.useI18n()
  const chartData: Ref<KChartData> = computed(() => {

    try {
      if (exploreResult.value && 'meta' in exploreResult.value && 'data' in exploreResult.value) {
        const records = exploreResult.value.data as AnalyticsExploreRecord[]
        const { display, metric_names: metricNames, start, end } = exploreResult.value.meta
        const startMs = new Date(start).getTime()
        const endMs = new Date(end).getTime()

        if (!metricNames) {
          console.error('Cannot build chart data from this explore result. Missing metric names.')

          return { datasets: [] }
        }

        const dimensionFieldNames = (display && Object.keys(display)) || metricNames

        // Time based datasets can only display one "dimension"
        // It will either be the first dimension or if no dimensions
        // are provided, then the metric is the primary dimension
        const dimension = (dimensionFieldNames && dimensionFieldNames[0]) as string
        const dimensionDisplay = display[dimension]
        let datasetLabels: DatasetLabel[] = (display && dimensionDisplay && Object.keys(dimensionDisplay).map(id => ({ id, name: dimensionDisplay[id]?.name ?? '' }))) || metricNames.map(name => ({ id: name, name }))

        // If the dimension is a country_code, get the country's display name
        if (dimension === 'country_code') {
          datasetLabels = datasetLabels.map(label => ({
            ...label,
            name: getCountryName(label.id as CountryISOA2) || label.name,
          }))
        }

        // Bail out early if we can't handle the value of `step`.
        // Not sure when this happens, but it seems to at times in production.
        const stepMs = exploreResult.value.meta.granularity_ms

        if (typeof stepMs !== 'number' || isNaN(stepMs) || !isFinite(stepMs) || stepMs === 0) {
          console.error('Invalid step value:', stepMs)

          return { datasets: [], labels: [] }
        }

        if (!records.length) {
          return { datasets: [], labels: [] }
        }

        const offsetMs = originToOffset(startMs)
        const zeroFilledTimeSeries = createZeroFilledTimeSeries(startMs, endMs, stepMs, offsetMs, records)
        const dimensionPositions = new Set<string>()

        const timedEvents = !records?.length
          ? {}
          : records.reduce((acc: { [label: string]: any }, druidRow) => {
            const timestamp: number = new Date(druidRow.timestamp).valueOf()
            const event = druidRow.event as { [label: string]: string | number }

            for (const metric of metricNames) {
              dimensionPositions.add(metric)
              if (!(timestamp in acc)) {
                acc[timestamp] = {}
              }

              if (!(metric in acc[timestamp])) {
                acc[timestamp][metric] = {}
              }
            }

            for (const metric of metricNames) {
              datasetLabels.forEach((label: DatasetLabel) => {
                if (event[dimension] === label.id || metric === label.id) {
                  if (!acc[timestamp][metric]) {
                    acc[timestamp][metric] = {}
                  }
                  acc[timestamp][metric][label.name] = Math.round(Number(event[metric]) * 1e3) / 1e3
                } else if (!dimensionFieldNames.length) { // using metrics as dimensions
                  if (!acc[timestamp][metric]) {
                    acc[timestamp][metric] = {}
                  }
                  acc[timestamp][metric][label.name] = Math.round(Number(event[label.id]) * 1e3) / 1e3
                }
              })
            }

            return acc
          }, {})

        const dimensionsCrossMetrics: Array<[string, string, boolean]> = metricNames.length === 1
          ? metricNames.flatMap<[string, string, boolean]>(metric => {
            return datasetLabels.map<[string, string, boolean]>(label => [metric, label.name, label.id === 'empty'])
          })
          : datasetLabels.map(label => [label.name, label.name, label.id === 'empty'])

        const datasets: Dataset[] = [...dimensionsCrossMetrics].map(([metric, dimension, isSegmentEmpty], i) => {
          const filled = zeroFilledTimeSeries.map(ts => {
            if (ts in timedEvents && metric in timedEvents[ts]) {
              return { x: ts, y: timedEvents[ts][metric][dimension] || 0 }
            }

            return { x: ts, y: 0 }
          })

          // eslint-disable-next-line prefer-const
          let { colorPalette, fill } = deps

          if (isNullOrUndef(colorPalette)) {
            colorPalette = datavisPalette
          }

          const baseColor = determineBaseColor(i, dimension, isSegmentEmpty, colorPalette)

          return {
            rawDimension: dimension,
            rawMetric: metric,
            // @ts-ignore - dynamic i18n key
            label: (i18n && i18n.te(`chartLabels.${dimension}`) && i18n.t(`chartLabels.${dimension}`)) || dimension,
            borderColor: baseColor,
            backgroundColor: baseColor,
            data: filled,
            total: filled.reduce((acc, { y }) => acc + Number(y), 0),
            ...defaultLineOptions,
            fill,
            borderWidth: fill ? NO_BORDER : BORDER_WIDTH,
            isSegmentEmpty,
          }
        })

        if (dimension === 'status_code' || dimension === 'status_code_grouped') {
          // Sort by dimension labels.
          datasets.sort((a, b) => (a.label ?? '') < (b.label ?? '') ? -1 : 1)
        } else {
          // Display largest dataset on top
          // sort by total, descending
          datasets.sort((a, b) => (Number(a.total) < Number(b.total) ? -1 : 1))
        }

        return {
          datasets,
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

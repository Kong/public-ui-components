import type { AnalyticsExploreRecord, CountryISOA2, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { Ref } from 'vue'
import { DIMENSION_COUNTRY_CODE, EMPTY_SEGMENT_ID } from '../types'
import type { AnalyticsChartColors, Dataset, DatasetLabel, KChartData } from '../types'

import { computed, unref } from 'vue'
import { parseISO } from 'date-fns'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import {
  datavisPalette,
  determineBaseColor,
  sortDatasetsByDimension,
} from '../utils'
import { translateChartLabel } from '../utils/chart-labels'
import composables from '.'

const range = (start: number, stop: number, step: number = 1): number[] =>
  Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)

const originToOffset = (origin: string | number): number => {
  if (typeof origin === 'string') {
    const toNumber = +origin

    if (toNumber) {
      return toNumber
    }

    try {
      return parseISO(origin).getTime()
    } catch (e) {
      if (e instanceof RangeError) {
        return 0
      }

      throw e
    }
  }

  return origin
}

export const createZeroFilledTimeSeries = (
  startMs: number,
  endMs: number,
  stepMs: number,
  offsetMs: number,
  records: AnalyticsExploreRecord[],
) => {
  const ZERO_FILL_PADDING = 60 * 1000
  const lastEndMs = Math.max(
    endMs - ZERO_FILL_PADDING,
    Math.max(...(records || []).map(event => new Date(event.timestamp).valueOf())),
  )

  const roundedStart = Math.floor((startMs - offsetMs) / stepMs) * stepMs + offsetMs
  const roundedEnd = Math.floor((lastEndMs - offsetMs) / stepMs) * stepMs + offsetMs + stepMs

  return range(roundedStart, roundedEnd, stepMs)
}

export default function useTimeseriesChartData(
  {
    colorPalette = datavisPalette,
    fill = false,
  }: {
    colorPalette?: AnalyticsChartColors | string[] | Ref<AnalyticsChartColors | string[]>
    fill?: boolean | Ref<boolean>
  },
  exploreResult: Ref<ExploreResultV4>,
): Ref<KChartData> {
  const { i18n } = composables.useI18n()

  return computed(() => {
    try {
      if (!exploreResult.value || !('meta' in exploreResult.value) || !('data' in exploreResult.value)) {
        return { datasets: [] }
      }

      const records = exploreResult.value.data as AnalyticsExploreRecord[]
      const {
        display,
        metric_names: metricNames,
        start,
        end,
        granularity_ms: stepMs,
      } = exploreResult.value.meta

      const startMs = new Date(start).getTime()
      const endMs = new Date(end).getTime()

      if (!metricNames) {
        console.error('Cannot build chart data from this explore result. Missing metric names.')

        return { datasets: [] }
      }

      const dimensionFieldNames = (display && Object.keys(display)) || metricNames
      const dimension = dimensionFieldNames[0]
      const dimensionDisplay = display?.[dimension]
      let datasetLabels: DatasetLabel[] =
        (display && dimensionDisplay && Object.keys(dimensionDisplay).map(id => ({ id, name: dimensionDisplay[id].name }))) ||
        metricNames.map(name => ({ id: name, name }))

      if (dimension === DIMENSION_COUNTRY_CODE) {
        datasetLabels = datasetLabels.map(label => ({
          ...label,
          name: getCountryName(label.id as CountryISOA2) || label.name,
        }))
      }

      if (typeof stepMs !== 'number' || isNaN(stepMs) || !isFinite(stepMs) || stepMs === 0) {
        console.error('Invalid step value:', stepMs)

        return { datasets: [], labels: [] }
      }

      if (!records.length || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return { datasets: [], labels: [] }
      }

      const offsetMs = originToOffset(startMs)
      const zeroFilledTimeSeries = createZeroFilledTimeSeries(startMs, endMs, stepMs, offsetMs, records)

      const timedEvents = records.reduce((acc: Record<string, Record<string, Record<string, number>>>, druidRow) => {
        const timestamp: number = new Date(druidRow.timestamp).valueOf()
        const event = druidRow.event as { [label: string]: string | number }

        if (!(timestamp in acc)) {
          acc[timestamp] = {}
        }

        for (const metric of metricNames) {
          if (!(metric in acc[timestamp])) {
            acc[timestamp][metric] = {}
          }

          datasetLabels.forEach((label: DatasetLabel) => {
            if (event[dimension] === label.id || metric === label.id) {
              acc[timestamp][metric][label.name] = Math.round(Number(event[metric]) * 1e3) / 1e3
            } else if (!dimensionFieldNames.length) {
              acc[timestamp][metric][label.name] = Math.round(Number(event[label.id]) * 1e3) / 1e3
            }
          })
        }

        return acc
      }, {})

      const dimensionsCrossMetrics: Array<[string, string, boolean]> = metricNames.length === 1
        ? metricNames.flatMap<[string, string, boolean]>(metric => {
          return datasetLabels.map<[string, string, boolean]>(label => [metric, label.name, label.id === EMPTY_SEGMENT_ID])
        })
        : datasetLabels.map(label => [label.name, label.name, label.id === EMPTY_SEGMENT_ID])

      const datasets: Dataset[] = dimensionsCrossMetrics.map(([metric, dimensionName, isSegmentEmpty], index) => {
        const filled = zeroFilledTimeSeries.map(ts => {
          if (ts in timedEvents && metric in timedEvents[ts]) {
            return { x: ts, y: timedEvents[ts][metric][dimensionName] || 0 }
          }

          return { x: ts, y: 0 }
        })

        const baseColor = determineBaseColor(index, dimensionName, isSegmentEmpty, unref(colorPalette))

        return {
          rawDimension: dimensionName,
          rawMetric: metric,
          label: translateChartLabel(i18n, dimensionName),
          borderColor: baseColor,
          backgroundColor: baseColor,
          data: filled,
          total: filled.reduce((acc, { y }) => acc + Number(y), 0),
          fill: unref(fill),
          isSegmentEmpty,
        }
      })

      sortDatasetsByDimension(datasets, dimension)

      return { datasets }
    } catch (err) {
      console.error(err)

      return { datasets: [], labels: [] }
    }
  })
}

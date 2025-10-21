// useExploreResultToEchartsOption.ts
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { SeriesOption } from 'echarts'
import type { AnalyticsExploreRecord, CountryISOA2, ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import { parseISO } from 'date-fns'
import {
  datavisPalette,
  determineBaseColor,
} from '../utils'
import composables from '.'
import type { ECBasicOption } from 'echarts/types/dist/shared'

// types
type DatasetLabel = { id: string, name: string }

// util: range, origin normalization, zero-fill boundaries
const range = (start: number, stop: number, step: number = 1): number[] => {
  const len = Math.max(0, Math.ceil((stop - start) / step))
  return Array(len).fill(start).map((x, y) => x + y * step)
}

const originToOffset = (origin: string | number): number => {
  if (typeof origin === 'string') {
    const toNumber = +origin
    if (toNumber) return toNumber
    // parseISO doesn't throw for invalid strings, it returns Invalid Date,
    // so guard by checking valueOf() validity
    const parsed = parseISO(origin)
    const t = parsed.valueOf()
    if (!Number.isFinite(t)) return 0
    return t
  }
  return origin
}

const createZeroFilledTimeSeries = (
  startMs: number,
  endMs: number,
  stepMs: number,
  offsetMs: number,
  records: AnalyticsExploreRecord[] | undefined,
) => {
  const ZERO_FILL_PADDING = 60 * 1000

  // safely compute last end time; if records is empty, fall back to endMs - padding
  const lastRecordTs = (records && records.length)
    ? Math.max(...records.map(e => new Date(e.timestamp).valueOf()))
    : endMs - ZERO_FILL_PADDING

  const lastEndMs = Math.max(endMs - ZERO_FILL_PADDING, lastRecordTs)

  const roundedStart = Math.floor((startMs - offsetMs) / stepMs) * stepMs + offsetMs
  const roundedEnd = Math.floor((lastEndMs - offsetMs) / stepMs) * stepMs + offsetMs + stepMs

  return range(roundedStart, roundedEnd, stepMs)
}

// main adapter: ExploreResultV4 -> EChartsOption
export default function useExploreResultToEChartTimeseries({
  exploreResult,
  fill = false,
} : {
  exploreResult: Ref<ExploreResultV4>
  fill?: boolean
}): Ref<ECBasicOption> {
  const { i18n } = composables.useI18n()

  const option = computed<ECBasicOption>(() => {
    try {
      if (!exploreResult.value || !('meta' in exploreResult.value) || !('data' in exploreResult.value)) {
        return {}
      }

      const records = exploreResult.value.data as AnalyticsExploreRecord[]
      const { display, metric_names: metricNames, start_ms: startMs, end_ms: endMs, granularity_ms: stepMs } = exploreResult.value.meta

      if (!metricNames) {
        console.error('Missing metric names')
        return {}
      }

      if (typeof stepMs !== 'number' || isNaN(stepMs) || !isFinite(stepMs) || stepMs === 0) {
        console.error('Invalid step value:', stepMs)
        return {}
      }

      if (!records || !records.length) {
        return {}
      }

      const dimensionFieldNames = (display && Object.keys(display)) || metricNames
      const dimension = dimensionFieldNames[0]
      const dimensionDisplay = display?.[dimension]
      let datasetLabels: DatasetLabel[] =
        (dimensionDisplay && Object.keys(dimensionDisplay).map(id => ({ id, name: dimensionDisplay[id].name }))) ||
        metricNames.map(name => ({ id: name, name }))

      if (dimension === 'country_code') {
        datasetLabels = datasetLabels.map(label => ({
          ...label,
          name: getCountryName(label.id as CountryISOA2) || label.name,
        }))
      }

      const offsetMs = originToOffset(startMs)
      const zeroFilledTimeSeries = createZeroFilledTimeSeries(startMs, endMs, stepMs, offsetMs, records)

      const timedEvents = records.reduce((acc: Record<number, Record<string, Record<string, number>>>, druidRow) => {
        const timestamp = new Date(druidRow.timestamp).valueOf()
        const event = druidRow.event as Record<string, string | number>

        for (const metric of metricNames) {
          if (!(timestamp in acc)) acc[timestamp] = {}
          if (!(metric in acc[timestamp])) acc[timestamp][metric] = {}
        }

        for (const metric of metricNames) {
          datasetLabels.forEach(label => {
            // when dimension field matches segment id OR metric matches segment id (for single-metric cross segments)
            if (event[dimension] === label.id || metric === label.id) {
              if (!acc[timestamp][metric]) acc[timestamp][metric] = {}
              acc[timestamp][metric][label.name] = Math.round(Number(event[metric]) * 1e3) / 1e3
            } else if (!dimensionFieldNames.length) {
              if (!acc[timestamp][metric]) acc[timestamp][metric] = {}
              acc[timestamp][metric][label.name] = Math.round(Number(event[label.id]) * 1e3) / 1e3
            }
          })
        }

        return acc
      }, {})

      const dimensionsCrossMetrics: Array<[string, string, boolean]> =
        metricNames.length === 1
          ? metricNames.flatMap(metric => datasetLabels.map(label => [metric, label.name, label.id === 'empty'] as [string, string, boolean]))
          : datasetLabels.map(label => [label.name, label.name, label.id === 'empty'] as [string, string, boolean])

      // build ECharts series
      const series = dimensionsCrossMetrics.map<SeriesOption>(([metric, dimensionName, isSegmentEmpty], i) => {
        const filled = zeroFilledTimeSeries.map(ts => {
          const y = (timedEvents[ts]?.[metric]?.[dimensionName] ?? 0) as number
          return [ts, y] as [number, number]
        })

        const baseColor = determineBaseColor(i, dimensionName, isSegmentEmpty, datavisPalette!)

        const total = filled.reduce((acc, [, y]) => acc + Number(y), 0)
        const translated = (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${dimensionName}`))
          ? i18n.t(`chartLabels.${dimensionName}`)
          : dimensionName

        return {
          type: 'line',
          name: translated as string,
          data: filled,
          showSymbol: false,
          smooth: false,
          sampling: 'lttb',
          lineStyle: {
            width: fill ? 0 : 5,
          },
          itemStyle: {
            color: baseColor,
            borderColor: baseColor,
          },
          areaStyle: fill ? {} : undefined,
          emphasis: { focus: 'series' },
          stack: fill ? 'total' : undefined,
          z: total,
          // keep original flag for downstream logic if anything reads it

          // @ts-ignore - ECharts series accepts arbitrary keys; keep flag for compatibility
          isSegmentEmpty,
        } as SeriesOption
      })

      // sort like your Chart.js path
      if (dimension === 'status_code' || dimension === 'status_code_grouped') {
        series.sort((a, b) => String(a.name) < String(b.name) ? -1 : 1)
      } else {
        series.sort((a, b) => {
          const sum = (s: any) => (s.data as Array<[number, number]>)?.reduce((acc, [, y]) => acc + Number(y), 0) || 0
          return sum(a) < sum(b) ? -1 : 1
        })
      }

      const option: ECBasicOption = {
        color: undefined, // we set per-series colors
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line' },
          valueFormatter: (v: any) => `${v}`,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          scale: true,
        },
        yAxis: {
          type: 'value',
          axisLine: { show: true },
          splitLine: { show: true },
        },
        legend: { type: 'scroll' },
        series,
        toolbox: { show: false },
        brush: {
          brushType: 'lineX',
        },
      }

      return option
    } catch (err) {
      console.error(err)
      return {}
    }
  })

  return option
}

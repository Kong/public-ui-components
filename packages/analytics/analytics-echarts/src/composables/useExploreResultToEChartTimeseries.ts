// useExploreResultToEchartsOption.ts
import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import type { SeriesOption } from 'echarts'
import type { AnalyticsExploreRecord, CountryISOA2, ExploreAggregations, ExploreResultV4, ReportChartTypes } from '@kong-ui-public/analytics-utilities'
import { getCountryName } from '@kong-ui-public/analytics-utilities'
import { parseISO } from 'date-fns'
import {
  datavisPalette,
  determineBaseColor,
  thresholdColor,
} from '../utils'
import composables from '.'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { TooltipState } from 'src/components/ChartTooltip.vue'
import type { Threshold, ThresholdType } from 'src/components/AnalyticsEcharts.vue'

// types
type DatasetLabel = { id: string, name: string }
export type ThresholdIntersection = {
  start: number
  end: number
  type: ThresholdType
}

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

const getExactIntersection = (p0: [number, number], p1: [number, number], targetY: number): number => {
  const dy = p1[1] - p0[1]
  if (dy === 0) {
    return p1[0]
  }
  const f = (targetY - p0[1]) / dy
  return p0[0] + f * (p1[0] - p0[0])
}


export const getThresholdIntersections = (data: Array<[number, number]>, thresholds: Threshold[]): ThresholdIntersection[] => {
  const intersections: ThresholdIntersection[] = []

  thresholds.filter(t => t.highlightIntersections).forEach((t) => {
    const intersectionTrack = data.map(([x, y]) => ({
      ts: x,
      aboveThreshold: y >= t.value,
    }))

    // the intersectionStart begins with a value if the initial datapoint is above the threshold
    let intersectionStart: number | undefined = intersectionTrack[0].aboveThreshold
      ? data[0][0]
      : undefined

    for (let i = 1; i < intersectionTrack.length; i++) {
      if (!intersectionTrack[i - 1].aboveThreshold && intersectionTrack[i].aboveThreshold) {
        // If the series was under the threshold line and goes to above the threshold line
        intersectionStart = getExactIntersection(
          data[i - 1],
          data[i],
          t.value,
        )
      } else if (intersectionTrack[i - 1].aboveThreshold && !intersectionTrack[i].aboveThreshold) {
        // if the series was above the threshold line and goes to below the threshold line
        if (intersectionStart !== undefined) {
          intersections.push({
            start: intersectionStart,
            end: getExactIntersection(
              data[i - 1],
              data[i],
              t.value,
            ),
            type: t.type,
          })
          intersectionStart = undefined
        }
      }
    }
    // If we reach the end and intersectionStart is still defined, it means the intersection goes till the end of the data
    if (intersectionStart !== undefined) {
      intersections.push({
        start: intersectionStart,
        end: intersectionTrack[intersectionTrack.length - 1].ts,
        type: t.type,
      })
    }
  })

  return intersections
}

export const mergeThresholdIntersections = (intersections: ThresholdIntersection[]): ThresholdIntersection[] => {
  if (!intersections.length) {
    return []
  }

  intersections.sort((a, b) => a.type.localeCompare(b.type) || a.start - b.start)

  const merged: ThresholdIntersection[] = []

  for (const curr of intersections) {
    const last = merged.findLast(({ type }) => type === curr.type)
    if (last && curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end)
    } else {
      merged.push({ ...curr })
    }
  }

  return merged
}


// main adapter: ExploreResultV4 -> EChartsOption
export default function useExploreResultToEChartTimeseries({
  exploreResult,
  chartType,
  tooltipState,
  stacked = ref(false),
  threshold = ref(undefined),
} : {
  exploreResult: Ref<ExploreResultV4>
  chartType: Ref<ReportChartTypes>
  tooltipState: Ref<TooltipState>
  stacked?: Ref<boolean>
  threshold?: Ref<Partial<Record<ExploreAggregations, Threshold[]>> | undefined>
}) {
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
        const translated = (i18n && typeof i18n.te === 'function' && i18n.te(`chartLabels.${dimensionName}` as any))
          ? i18n.t(`chartLabels.${dimensionName}` as any)
          : dimensionName

        const reportChartTypesToEChartTypesMap: Partial<Record<ReportChartTypes, 'line' | 'bar'>> = {
          timeseries_line: 'line',
          timeseries_bar: 'bar',
        }

        let markAreaData: any[] = []
        let markLineData: any[] = []
        if (threshold.value) {
          const intersections = Object.values(threshold.value)
            .flatMap(thresh => getThresholdIntersections(filled, thresh))

          // Build markArea data based on intersections
          markAreaData = intersections.map(intersection => {
            const { start, end } = intersection

            return [
              { xAxis: start, yAxis: 0, itemStyle: { color: 'rgba(255, 0, 0, 0.2)' } },
              { xAxis: end, yAxis: Infinity },
            ]
          })

          markLineData = Object.values(threshold.value).flatMap(thresh =>
            thresh.map(t => ({
              yAxis: t.value,
              label: {
                show: false,
                position: 'middle',
                formatter: `${t.type}: ${t.value}`,
              },
              lineStyle: {
                color: thresholdColor(t.type),
                type: 'dashed',
              },
            })),
          )
        }

        return {
          type: reportChartTypesToEChartTypesMap[chartType.value],
          name: translated as string,
          data: filled,
          showSymbol: false,
          smooth: false,
          sampling: 'lttb',
          lineStyle: {
            width: stacked.value ? 0 : 2,
          },
          itemStyle: {
            color: baseColor,
            borderColor: baseColor,
          },
          areaStyle: stacked.value ? {} : undefined,
          emphasis: { focus: 'series' },
          stack: stacked.value ? 'total' : undefined,
          z: total,
          isSegmentEmpty,
          // add the threshold line
          markLine: {
            data: i === 0 ? markLineData : [],
          },
          markArea: {
            silent: true,
            data: markAreaData,
          },
        } as SeriesOption
      })

      if (dimension === 'status_code' || dimension === 'status_code_grouped') {
        series.sort((a, b) => String(a.name) < String(b.name) ? -1 : 1)
      } else {
        series.sort((a, b) => {
          const sum = (s: any) => (s.data as Array<[number, number]>)?.reduce((acc, [, y]) => acc + Number(y), 0) || 0
          return sum(a) < sum(b) ? -1 : 1
        })
      }

      const option: ECBasicOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line' },
          formatter: (params: any) => {
            tooltipState.value.entries = params.map((param: any) => ({
              label: param.seriesName,
              value: param.value[1],
              backgroundColor: param.color,
              borderColor: param.borderColor,
            }))
            tooltipState.value.visible = true
            tooltipState.value.subtitle = params[0]?.axisValueLabel

            return undefined
          },
        },
        xAxis: {
          type: 'time',
          scale: true,
          name: '@timestamp per 5 minuntes',
          nameGap: 30,
          nameLocation: 'middle',
          axisLabel: { margin: 6 },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: true },
          splitLine: { show: true },
          name: 'Request count',
          nameGap: 50,
          nameLocation: 'middle',
          axisLabel: { margin: 6 },
        },
        legend: {
          type: 'scroll',
          bottom: 0,
          left: 'center',
          itemGap: 8,
        },
        series,
        toolbox: { show: false },
        brush: {
          brushType: 'lineX',
          xAxisIndex: [0],
        },
        media: [
          {
            query: { maxHeight: 200 },
            option: {
              grid: {
                bottom: 0,
                top: 0,
                left: 0,
                right: 0,
              },
              xAxis: {
                name: '',
              },
              yAxis: {
                name: '',
              },
              legend: { show: false },
            },
          },
          {
            query: { minHeight: 200 },
            option: {
              grid: {
                bottom: 45,
                top: 0,
                left: 0,
                right: 0,
              },
              xAxis: {
                name: '@Timestamp per 5 minutes',
              },
              yAxis: {
                name: 'Request count',
              },
              legend: { show: true },
            },
          },
          {
            query: { maxWidth: 500 },
            option: {
              grid: {
                bottom: 45,
                top: 0,
                left: 0,
                right: 0,
              },
              xAxis: {
                name: '',
              },
              yAxis: {
                name: '',
              },
            },
          },
          {
            query: { minWidth: 501 },
            option: {
              grid: {
                top: 25,
                left: 25,
                right: 25,
                bottom: 50,
                containLabel: true,
              },
              xAxis: {
                name: '@timestamp per 5 minutes',
              },
              yAxis: {
                name: 'Request count',
              },
            },
          },
        ],
      }

      return option
    } catch (err) {
      console.error(err)
      return {}
    }
  })

  return {
    option,
  }
}

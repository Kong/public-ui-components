import type { ExploreAggregations, GranularityValues } from '@kong-ui-public/analytics-utilities'
import type { SeriesOption } from 'echarts'
import type { ChartScrollWindow, ChartTooltipSortFn, KChartData, Threshold, TooltipState } from '../types'
import { formatChartTicksByGranularity, thresholdColor } from '../utils'
import {
  createCrossSectionBarTooltipFormatter,
  createCrossSectionDonutTooltipFormatter,
  createTimeseriesTooltipFormatter,
} from './build-echart-tooltip-formatters'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import { resolveChartScrollWindow, shouldHideAnnotationsForBreakpoint } from './chart-scroll'

const MAX_LABEL_LENGTH = 20
const BAR_LABEL_MIN_SIZE = 72
const HORIZONTAL_AXIS_LABEL_WIDTH = 112
const VERTICAL_AXIS_LABEL_WIDTH = 96
const HORIZONTAL_BAR_VALUE_LABEL_PADDING = 12
const HORIZONTAL_BAR_METRIC_TITLE_GAP = 30
const RESPONSIVE_MAX_HEIGHT = 200
const RESPONSIVE_MEDIUM_MAX_WIDTH = 500
const RESPONSIVE_SMALL_MAX_WIDTH = 400
const TIMESERIES_GRID_BOTTOM = 28
const HORIZONTAL_BAR_GRID_BOTTOM = 28
const HORIZONTAL_BAR_TITLE_GAP = 140
const HORIZONTAL_BAR_VALUE_LABEL_CHAR_WIDTH = 7
const VERTICAL_BAR_DIMENSION_TITLE_GAP = 36
const VERTICAL_BAR_GRID_BOTTOM = 32
const VERTICAL_BAR_GRID_LEFT = 88
const VERTICAL_BAR_LABEL_MIN_HEIGHT = 80
const VERTICAL_BAR_LABEL_MIN_WIDTH = 52
const VERTICAL_BAR_LABEL_WIDTH_RATIO = 0.5
const VERTICAL_BAR_METRIC_TITLE_GAP = 76
const DATA_ZOOM_SLIDER_GAP = 8
const DATA_ZOOM_SLIDER_SIZE = 12
const DATA_ZOOM_SLIDER_SHOW_DATA_SHADOW = false

type ResponsiveMediaOptions = {
  maxHeight: ECBasicOption
  mediumWidth: ECBasicOption
  smallWidth: ECBasicOption
}

const truncateAxisLabel = (label: string) => {
  if (label.length > MAX_LABEL_LENGTH) {
    return `${label.slice(0, MAX_LABEL_LENGTH)}...`
  }

  return label
}

const estimateHorizontalBarLabelWidth = (label: string): number => {
  return Math.max(BAR_LABEL_MIN_SIZE, label.length * HORIZONTAL_BAR_VALUE_LABEL_CHAR_WIDTH)
}

const buildCrossSectionDataZoom = ({
  chartType,
  categoryCount,
  scrollWindow,
}: {
  chartType: 'horizontal_bar' | 'vertical_bar'
  categoryCount: number
  scrollWindow: ChartScrollWindow | null
}) => {
  const isHorizontal = chartType === 'horizontal_bar'

  if (!scrollWindow || categoryCount <= 0) {
    return {
      dataZoom: undefined,
      grid: undefined,
    }
  }

  return isHorizontal
    ? {
      dataZoom: [{
        type: 'slider' as const,
        yAxisIndex: 0,
        orient: 'vertical' as const,
        startValue: scrollWindow.startValue,
        endValue: scrollWindow.endValue,
        width: DATA_ZOOM_SLIDER_SIZE,
        right: DATA_ZOOM_SLIDER_GAP / 2,
        top: 20,
        bottom: HORIZONTAL_BAR_GRID_BOTTOM,
        showDetail: false,
        brushSelect: false,
        showDataShadow: DATA_ZOOM_SLIDER_SHOW_DATA_SHADOW,
      }, {
        type: 'inside' as const,
        yAxisIndex: 0,
        startValue: scrollWindow.startValue,
        endValue: scrollWindow.endValue,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      }],
      grid: {
        right: 24 + DATA_ZOOM_SLIDER_SIZE + DATA_ZOOM_SLIDER_GAP,
      },
    }
    : {
      dataZoom: [{
        type: 'slider' as const,
        xAxisIndex: 0,
        startValue: scrollWindow.startValue,
        endValue: scrollWindow.endValue,
        height: DATA_ZOOM_SLIDER_SIZE,
        bottom: DATA_ZOOM_SLIDER_GAP / 2,
        left: VERTICAL_BAR_GRID_LEFT,
        right: 56,
        showDetail: false,
        brushSelect: false,
        showDataShadow: DATA_ZOOM_SLIDER_SHOW_DATA_SHADOW,
      }, {
        type: 'inside' as const,
        xAxisIndex: 0,
        startValue: scrollWindow.startValue,
        endValue: scrollWindow.endValue,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      }],
      grid: {
        bottom: VERTICAL_BAR_GRID_BOTTOM + DATA_ZOOM_SLIDER_SIZE + DATA_ZOOM_SLIDER_GAP,
      },
    }
}

const buildResponsiveMediaOptions = ({
  maxHeight,
  mediumWidth,
  smallWidth,
}: ResponsiveMediaOptions): NonNullable<ECBasicOption['media']> => {
  return [
    {
      query: { maxHeight: RESPONSIVE_MAX_HEIGHT },
      option: maxHeight,
    },
    {
      query: { maxWidth: RESPONSIVE_MEDIUM_MAX_WIDTH },
      option: mediumWidth,
    },
    {
      query: { maxWidth: RESPONSIVE_SMALL_MAX_WIDTH },
      option: smallWidth,
    },
  ]
}

const getExactIntersection = (p0: [number, number], p1: [number, number], targetY: number): number => {
  const dy = p1[1] - p0[1]

  if (dy === 0) {
    return p1[0]
  }

  const fraction = (targetY - p0[1]) / dy

  return p0[0] + fraction * (p1[0] - p0[0])
}

type ThresholdIntersection = {
  start: number
  end: number
  type: Threshold['type']
}

export const getThresholdIntersections = (
  data: Array<[number, number]>,
  thresholds: Threshold[],
): ThresholdIntersection[] => {
  const intersections: ThresholdIntersection[] = []

  thresholds.filter(threshold => threshold.highlightIntersections).forEach((threshold) => {
    const track = data.map(([x, y]) => ({
      ts: x,
      aboveThreshold: y >= threshold.value,
    }))

    let intersectionStart: number | undefined = track[0]?.aboveThreshold ? data[0][0] : undefined

    for (let index = 1; index < track.length; index++) {
      if (!track[index - 1].aboveThreshold && track[index].aboveThreshold) {
        intersectionStart = getExactIntersection(data[index - 1], data[index], threshold.value)
      } else if (track[index - 1].aboveThreshold && !track[index].aboveThreshold && intersectionStart !== undefined) {
        intersections.push({
          start: intersectionStart,
          end: getExactIntersection(data[index - 1], data[index], threshold.value),
          type: threshold.type,
        })
        intersectionStart = undefined
      }
    }

    if (intersectionStart !== undefined) {
      intersections.push({
        start: intersectionStart,
        end: track[track.length - 1].ts,
        type: threshold.type,
      })
    }
  })

  return intersections
}

export const buildTimeseriesOption = ({
  chartData,
  chartType,
  stacked,
  granularity,
  tooltipState,
  tooltipTitle,
  tooltipMetricDisplay,
  dimensionAxisTitle,
  metricAxisTitle,
  threshold,
  selectedLabels,
  formatValue,
  thresholdLabelFormatter,
  chartTooltipSortFn,
}: {
  chartData: KChartData
  chartType: 'timeseries_line' | 'timeseries_bar'
  stacked: boolean
  granularity: GranularityValues
  tooltipState: TooltipState
  tooltipTitle?: string
  tooltipMetricDisplay?: string
  dimensionAxisTitle?: string
  metricAxisTitle?: string
  threshold?: Partial<Record<ExploreAggregations, Threshold[]>>
  selectedLabels: Record<string, boolean>
  formatValue: (value: number) => string
  thresholdLabelFormatter: (threshold: Threshold) => string
  chartTooltipSortFn?: ChartTooltipSortFn
}): ECBasicOption => {
  const timestamps = chartData.datasets.flatMap(dataset =>
    dataset.data.flatMap(entry => typeof entry === 'number' ? [] : [Number(entry.x)]),
  )

  const firstTimestamp = Math.min(...timestamps)
  const lastTimestamp = Math.max(...timestamps)
  const dayBoundaryCrossed = timestamps.length > 0 && (
    (lastTimestamp - firstTimestamp) > (24 * 60 * 60 * 1000) ||
    new Date(firstTimestamp).getDate() !== new Date(lastTimestamp).getDate()
  )

  const selected = Object.fromEntries(chartData.datasets.map(dataset => {
    const label = dataset.label || ''

    return [label, selectedLabels[label] !== false]
  }))

  const thresholds = threshold ? Object.values(threshold).flatMap(value => value) : []
  const markLineData = thresholds.map(currentThreshold => ({
    yAxis: currentThreshold.value,
    label: {
      show: true,
      position: 'end',
      formatter: thresholdLabelFormatter(currentThreshold),
    },
    lineStyle: {
      color: thresholdColor(currentThreshold.type),
      type: 'dashed' as const,
    },
  }))

  const series: SeriesOption[] = chartData.datasets.map((dataset, index) => {
    const filled = dataset.data.map(entry => {
      if (typeof entry === 'number') {
        return [0, entry] as [number, number]
      }

      return [Number(entry.x), Number(entry.y)] as [number, number]
    })

    const markAreaData = thresholds.length
      ? getThresholdIntersections(filled, thresholds).map(intersection => ([
        { xAxis: intersection.start, yAxis: 0, itemStyle: { color: `${thresholdColor(intersection.type)}22` } },
        { xAxis: intersection.end, yAxis: Infinity },
      ]))
      : []

    return {
      type: chartType === 'timeseries_line' ? 'line' as const : 'bar' as const,
      name: dataset.label || '',
      data: filled,
      showSymbol: false,
      smooth: false,
      sampling: 'lttb',
      lineStyle: {
        width: stacked ? 0 : 2,
      },
      itemStyle: {
        color: dataset.backgroundColor || '',
        borderColor: dataset.borderColor || dataset.backgroundColor || '',
      },
      areaStyle: stacked ? {} : undefined,
      emphasis: { focus: 'series' },
      stack: stacked ? 'total' : undefined,
      z: dataset.total,
      markLine: {
        data: index === 0 ? markLineData : [],
      },
      markArea: {
        silent: true,
        data: markAreaData,
      },
    } as SeriesOption
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: createTimeseriesTooltipFormatter({
        granularity,
        tooltipState,
        tooltipTitle,
        tooltipMetricDisplay,
        formatValue,
        chartTooltipSortFn,
      }),
    },
    legend: {
      show: false,
      selected,
    },
    grid: {
      top: 25,
      left: 25,
      right: 25,
      bottom: TIMESERIES_GRID_BOTTOM,
      containLabel: true,
    },
    xAxis: {
      show: true,
      type: 'time',
      scale: true,
      name: dimensionAxisTitle,
      nameGap: 30,
      nameLocation: 'middle',
      axisLabel: {
        show: true,
        hideOverlap: true,
        margin: 6,
        formatter: (value: number) => formatChartTicksByGranularity({
          tickValue: new Date(value),
          granularity,
          dayBoundaryCrossed,
        }),
      },
    },
    yAxis: {
      show: true,
      type: 'value',
      axisLine: { show: true },
      name: metricAxisTitle,
      nameGap: 50,
      nameLocation: 'middle',
      axisLabel: {
        show: true,
        margin: 6,
      },
    },
    series,
    toolbox: { show: false },
    brush: {
      brushType: 'lineX',
      xAxisIndex: [0],
    },
    media: buildResponsiveMediaOptions({
      maxHeight: {
        grid: {
          bottom: 0,
          top: 0,
          left: 0,
          right: 0,
        },
        xAxis: {
          show: false,
        },
        yAxis: {
          show: false,
        },
      },
      mediumWidth: {
        grid: {
          left: 0,
        },
        xAxis: {
          splitNumber: 4,
        },
        yAxis: {
          show: false,
        },
      },
      smallWidth: {
        grid: {
          bottom: 0,
          left: 0,
        },
        xAxis: {
          show: false,
        },
        yAxis: {
          show: false,
        },
      },
    }),
  }
}

export const buildCrossSectionOption = ({
  chartData,
  chartType,
  chartWidth,
  chartHeight,
  scrollWindow,
  showAnnotations,
  stacked,
  tooltipState,
  tooltipTitle,
  tooltipMetricDisplay,
  dimensionAxisTitle,
  metricAxisTitle,
  selectedLabels,
  formatValue,
  chartTooltipSortFn,
}: {
  chartData: KChartData
  chartType: 'horizontal_bar' | 'vertical_bar' | 'donut'
  chartWidth: number
  chartHeight: number
  scrollWindow: ChartScrollWindow | null
  showAnnotations: boolean
  stacked: boolean
  tooltipState: TooltipState
  tooltipTitle?: string
  tooltipMetricDisplay?: string
  dimensionAxisTitle?: string
  metricAxisTitle?: string
  selectedLabels: Record<string, boolean>
  formatValue: (value: number) => string
  chartTooltipSortFn?: ChartTooltipSortFn
}): ECBasicOption => {
  if (chartType === 'donut') {
    const donutData = chartData.datasets.map(dataset => ({
      name: dataset.label,
      value: dataset.total || 0,
      itemStyle: { color: dataset.backgroundColor },
    }))

    const selected = Object.fromEntries(donutData.map(item => [String(item.name), selectedLabels[String(item.name)] !== false]))

    return {
      tooltip: {
        trigger: 'item',
        formatter: createCrossSectionDonutTooltipFormatter({
          tooltipState,
          tooltipTitle,
          tooltipMetricDisplay,
          dimensionAxisTitle,
          formatValue,
        }),
      },
      legend: {
        show: false,
        selected,
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '42%'],
        selectedMode: 'multiple',
        data: donutData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }],
      media: [
        {
          query: { maxWidth: 500 },
          option: {
            series: [{
              radius: ['38%', '62%'],
              center: ['50%', '44%'],
              label: {
                show: false,
              },
            }],
          },
        },
      ],
    }
  }

  const labels = chartData.labels || []
  const isHorizontal = chartType === 'horizontal_bar'
  const resolvedScrollWindow = resolveChartScrollWindow({
    axisSize: isHorizontal ? chartHeight : chartWidth,
    categoryCount: labels.length,
    scrollWindow,
  })
  const annotationsSuppressed = shouldHideAnnotationsForBreakpoint({
    chartWidth,
    chartHeight,
  }) || resolvedScrollWindow !== null
  const scrollConfig = buildCrossSectionDataZoom({
    chartType,
    categoryCount: labels.length,
    scrollWindow: resolvedScrollWindow,
  })
  const baseGrid = isHorizontal
    ? {
      left: 0,
      right: 24,
      bottom: HORIZONTAL_BAR_GRID_BOTTOM,
      top: 20,
      containLabel: true,
    }
    : {
      left: VERTICAL_BAR_GRID_LEFT,
      right: 56,
      bottom: VERTICAL_BAR_GRID_BOTTOM,
      top: 52,
      containLabel: true,
    }
  const grid = {
    ...baseGrid,
    ...scrollConfig.grid,
  }
  const selected = Object.fromEntries(chartData.datasets.map(dataset => {
    const label = dataset.label || ''

    return [label, selectedLabels[label] !== false]
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: createCrossSectionBarTooltipFormatter({
        chartData,
        tooltipState,
        tooltipTitle,
        tooltipMetricDisplay,
        dimensionAxisTitle,
        formatValue,
        chartTooltipSortFn,
      }),
    },
    legend: {
      show: false,
      selected,
    },
    grid,
    dataZoom: scrollConfig.dataZoom,
    xAxis: isHorizontal
      ? {
        show: true,
        type: 'value',
        axisLine: { show: true },
        name: metricAxisTitle,
        nameLocation: 'middle',
        nameGap: HORIZONTAL_BAR_METRIC_TITLE_GAP,
        axisLabel: {
          show: true,
          hideOverlap: true,
        },
      }
      : {
        show: true,
        type: 'category',
        data: labels,
        axisLine: { show: true },
        axisLabel: {
          show: true,
          hideOverlap: true,
          interval: 0,
          margin: 12,
          width: VERTICAL_AXIS_LABEL_WIDTH,
          overflow: 'truncate',
          formatter: (value: string) => truncateAxisLabel(value),
        },
        name: dimensionAxisTitle,
        nameLocation: 'middle',
        nameGap: VERTICAL_BAR_DIMENSION_TITLE_GAP,
      },
    yAxis: isHorizontal
      ? {
        show: true,
        type: 'category',
        inverse: true,
        data: labels,
        axisLine: { show: true },
        axisLabel: {
          show: true,
          hideOverlap: true,
          interval: 0,
          margin: 6,
          width: HORIZONTAL_AXIS_LABEL_WIDTH,
          overflow: 'truncate',
          formatter: (value: string) => truncateAxisLabel(value),
        },
        name: dimensionAxisTitle,
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: HORIZONTAL_BAR_TITLE_GAP,
      }
      : {
        show: true,
        type: 'value',
        axisLine: { show: true },
        name: metricAxisTitle,
        nameLocation: 'middle',
        nameGap: VERTICAL_BAR_METRIC_TITLE_GAP,
        axisLabel: {
          show: true,
          hideOverlap: true,
        },
      },
    series: chartData.datasets.map(dataset => ({
      name: dataset.label,
      type: 'bar',
      clip: false,
      data: dataset.data.map(entry => typeof entry === 'number' ? entry : entry.y),
      itemStyle: {
        color: dataset.backgroundColor,
      },
      stack: stacked ? 'total' : undefined,
      label: {
        show: showAnnotations && !annotationsSuppressed,
        position: stacked ? (isHorizontal ? 'insideRight' : 'insideTop') : (isHorizontal ? 'right' : 'top'),
        distance: isHorizontal ? 8 : 10,
        align: isHorizontal ? 'right' : undefined,
        verticalAlign: isHorizontal ? 'middle' : undefined,
        overflow: 'truncate',
        formatter: ({ value }: { value: number }) => {
          const numericValue = Number(value || 0)

          if (!numericValue) {
            return ''
          }

          return formatValue(numericValue)
        },
      },
      labelLayout: ({ rect, dataIndex }: {
        rect?: { width?: number, height?: number }
        dataIndex?: number
      }) => {
        if (!showAnnotations || annotationsSuppressed) {
          return { hide: true }
        }

        const availableSize = isHorizontal ? rect?.width : rect?.height

        if (isHorizontal) {
          const rawValue = Number(dataset.data[dataIndex ?? 0] ?? 0)
          const labelWidth = estimateHorizontalBarLabelWidth(formatValue(rawValue))

          return {
            hide: !availableSize || availableSize <= labelWidth + HORIZONTAL_BAR_VALUE_LABEL_PADDING,
          }
        }

        const rawValue = Number(dataset.data[dataIndex ?? 0] ?? 0)
        const labelWidth = estimateHorizontalBarLabelWidth(formatValue(rawValue))
        const minimumBarWidth = Math.max(VERTICAL_BAR_LABEL_MIN_WIDTH, labelWidth * VERTICAL_BAR_LABEL_WIDTH_RATIO)

        return {
          hide: !availableSize || availableSize < VERTICAL_BAR_LABEL_MIN_HEIGHT || !rect?.width || rect.width < minimumBarWidth,
        }
      },
      emphasis: {
        focus: 'series',
      },
    })),
    media: buildResponsiveMediaOptions({
      maxHeight: {
        grid: {
          bottom: 0,
          top: 0,
          left: 0,
          right: 0,
        },
        xAxis: {
          show: false,
        },
        yAxis: {
          show: false,
        },
      },
      mediumWidth: isHorizontal
        ? {
          grid: { left: 0, right: 44, top: 20, bottom: 28 },
          xAxis: {
            splitNumber: 4,
          },
          yAxis: {
            show: false,
          },
        }
        : {
          grid: { bottom: 52, top: 24, left: 12, right: 12 },
          xAxis: { axisLabel: { show: false } },
        },
      smallWidth: isHorizontal
        ? {
          grid: {
            left: 0,
            right: 44,
            top: 20,
            bottom: 28,
          },
          xAxis: {
            show: false,
          },
          yAxis: {
            show: false,
          },
        }
        : {
          grid: { bottom: 52, left: 0, right: 12 },
          xAxis: { show: false },
          yAxis: { show: false },
        },
    }),
  }
}

import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { KUI_FONT_FAMILY_TEXT } from '@kong/design-tokens'
import type { Chart, Plugin } from 'chart.js'
import type { Threshold, ThresholdType } from 'src/types'
import type { createI18n } from '@kong-ui-public/i18n'
import type english from '../../locales/en.json'
import { thresholdColor } from '../../utils'

const HOVER_TRIGGER_DELTA = 20
const THRESHOLD_ERROR_BRUSH_COLOR = 'rgba(255, 171, 171, 0.4)'
const THRESHOLD_WARNING_BRUSH_COLOR = 'rgba(255, 196, 0, 0.2)'

interface ThresholdOptions {
  threshold: Record<ExploreAggregations, Threshold[]> | undefined
}

type ThresholdExtra = Threshold & {
  hovered?: boolean
}

export type ThresholdIntersection = {
  start: number
  end: number
  type: ThresholdType
}

type Point = { x: number, y: number }

// Using linear interpolation to find the exact point at which the line intersects the threshold
const getExactIntersection = (p0: Point, p1: Point, targetY: number): number => {
  const dy = p1.y - p0.y
  if (dy === 0) {
    return p1.x
  }
  const f = (targetY - p0.y) / dy
  return p0.x + f * (p1.x - p0.x)
}

export const getThresholdIntersections = (chart: Chart, thresholds: Threshold[]): ThresholdIntersection[] => {
  const intersections: ThresholdIntersection[] = []
  chart.data.datasets.forEach((dataset) => {
    const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(dataset))
    if (!meta.visible) {
      return
    }

    const dataPoints = dataset.data as Array<{ x: number, y: number }>
    if (!dataPoints?.length) {
      return
    }

    thresholds.filter(t => t.highlightIntersections).forEach((t) => {
      const intersectionTrack = dataPoints.map((d) => ({
        ts: d.x,
        aboveThreshold: d.y >= t.value,
      }))

      // the intersectionStart begins with a value if the initial datapoint is above the threshold
      let intersectionStart: number | undefined = intersectionTrack[0].aboveThreshold
        ? dataPoints[0].x
        : undefined

      for (let i = 1; i < intersectionTrack.length; i++) {
        if (!intersectionTrack[i - 1].aboveThreshold && intersectionTrack[i].aboveThreshold) {
          // If the series was under the threshold line and goes to above the threshold line
          intersectionStart = getExactIntersection(
            dataPoints[i - 1],
            dataPoints[i],
            t.value,
          )
        } else if (intersectionTrack[i - 1].aboveThreshold && !intersectionTrack[i].aboveThreshold) {
          // if the series was above the threshold line and goes to below the threshold line
          if (intersectionStart !== undefined) {
            intersections.push({
              start: intersectionStart,
              end: getExactIntersection(
                dataPoints[i - 1],
                dataPoints[i],
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

export class ThresholdPlugin implements Plugin {
  id = 'thresholdPlugin'
  private _thresholds?: Record<ExploreAggregations, ThresholdExtra[]>
  private _mouseMoveHandler?: ((event: MouseEvent) => void)

  constructor(private i18n: ReturnType<typeof createI18n<typeof english>>) {}

  private _syncThresholds(pluginOptions: ThresholdOptions) {
    for (const key of Object.keys(pluginOptions.threshold || {})) {
      const threshold = pluginOptions.threshold?.[key as ExploreAggregations]
      if (threshold) {
        this._thresholds = {
          ...this._thresholds,
          [key as ExploreAggregations]: threshold.map((t) => ({ ...t, hovered: false })),
        } as Record<ExploreAggregations, ThresholdExtra[]>
      }
    }
    // Prune any thresholds that are no longer in the options
    if (this._thresholds) {
      for (const key of Object.keys(this._thresholds)) {
        if (!pluginOptions.threshold?.[key as ExploreAggregations]) {
          delete this._thresholds[key as ExploreAggregations]
        }
      }
    }
  }

  get thresholds() {
    return this._thresholds
  }

  // Gets called when chart options are updated
  beforeUpdate(chart: Chart, _: any, pluginOptions: ThresholdOptions): void {
    this._syncThresholds(pluginOptions)
  }


  beforeInit(chart: Chart, _: any, pluginOptions: ThresholdOptions): void {
    const canvas = chart.canvas
    this._syncThresholds(pluginOptions)

    const onMouseMove = (event: MouseEvent) => {
      if (chart) {
        const yPos = event.clientY
        const yScale = chart.scales['y']
        const rect = canvas.getBoundingClientRect()
        const yValue = yScale.getValueForPixel(yPos - rect.top)

        if (yValue) {
          for (const key of Object.keys(this._thresholds || {})) {
            const thresholds = this._thresholds?.[key as ExploreAggregations]
            if (thresholds) {
              thresholds.forEach((t) => {
                t.hovered = Math.abs(t.value - yValue) < HOVER_TRIGGER_DELTA
              })
            }
          }
        }
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    this._mouseMoveHandler = onMouseMove
  }

  afterDatasetsDraw(chart: Chart, _: any): void {
    const context = chart.ctx

    for (const key of Object.keys(this._thresholds || {})) {
      const threshold = this._thresholds?.[key as ExploreAggregations]

      if (threshold) {
        threshold.forEach((t) => {
          const yScale = chart.scales['y']
          const yValue = yScale.getPixelForValue(t.value)

          context.save()
          context.beginPath()
          context.moveTo(chart.chartArea.left, yValue)
          context.lineTo(chart.chartArea.right, yValue)
          context.lineWidth = 1
          context.strokeStyle = thresholdColor(t.type)
          context.setLineDash([5, 5])
          context.stroke()
          context.restore()

          let text: string = ''
          if (t.label) {
            text = `${t.label}: ${t.value}`
          } else if (t.type === 'warning') {
            text = this.i18n.t('chartLabels.threshold-warning', { value: t.value })
          } else if (t.type === 'error') {
            text = this.i18n.t('chartLabels.threshold-error', { value: t.value })
          } else {
            text = this.i18n.t('chartLabels.thatreshold-neutral', { value: t.value })
          }

          if (t.hovered) {
            context.save()
            context.fillStyle = thresholdColor(t.type)
            context.font = KUI_FONT_FAMILY_TEXT
            context.fillText(text, chart.chartArea.left, yValue - 4)
            context.restore()
          }
        })

        const intersections = getThresholdIntersections(chart, threshold)
        const mergedIntersections = mergeThresholdIntersections(intersections)

        mergedIntersections.forEach((intersection) => {
          // Draw brushed area between start and end of intersection
          const xStart = chart.scales['x'].getPixelForValue(intersection.start)
          const xEnd = chart.scales['x'].getPixelForValue(intersection.end)
          context.save()
          context.fillStyle = intersection.type === 'error' ? THRESHOLD_ERROR_BRUSH_COLOR : THRESHOLD_WARNING_BRUSH_COLOR
          context.fillRect(xStart, chart.chartArea.top, xEnd - xStart, chart.chartArea.bottom - chart.chartArea.top)
          context.restore()

          // Draw a horizontal line at the bottom of the chart area of thresholdColor(t.type)
          context.save()
          context.beginPath()
          context.moveTo(xStart, chart.chartArea.bottom)
          context.lineTo(xEnd, chart.chartArea.bottom)
          context.lineWidth = 2
          context.strokeStyle = thresholdColor(intersection.type)
          context.stroke()
          context.restore()
        })
      }
    }
  }

  beforeDestroy(chart: Chart): void {
    if (this._mouseMoveHandler) {
      chart.canvas.removeEventListener('mousemove', this._mouseMoveHandler)
    }
  }
}

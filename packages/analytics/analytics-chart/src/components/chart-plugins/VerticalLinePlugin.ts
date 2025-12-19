import type { Chart, ChartType, Plugin, TooltipItem } from 'chart.js'
import { Chart as Chartjs } from 'chart.js'

const drawLine = (
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  color: string = '#0275d8',
) => {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, top)
  ctx.lineTo(x, bottom)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.restore()
}

type BrushStrategy = 'group'

const brushingState: {
  x?: number
  chart?: Chart
  strategy?: BrushStrategy
  group?: string
} = {}

const clearBrushingState = () => {
  brushingState.x = undefined
  brushingState.chart = undefined
  brushingState.strategy = undefined
  brushingState.group = undefined
}

const EVENT_THROTTLE_MS = 10

export class VerticalLinePlugin implements Plugin {
  id = 'verticalLinePlugin'
  private _clickedSegment?: TooltipItem<ChartType> | undefined
  private _pause = false
  private _useBrushingState = false
  private _brushStrategy: BrushStrategy | undefined
  private _brushGroup: string | undefined

  constructor({
    brushGroup = undefined,
    brushStrategy = undefined,
    enableBrushing = false,
  }: {
    brushGroup?: string
    brushStrategy?: BrushStrategy
    enableBrushing?: boolean
  } = {}) {
    let validBrushStrategy = false
    if (brushStrategy === 'group') {
      validBrushStrategy = brushGroup !== undefined
    }

    this._useBrushingState = enableBrushing && validBrushStrategy
    this._brushStrategy = brushStrategy
    this._brushGroup = brushGroup
  }

  afterEvent(chart: Chart, args: any) {
    if (!this._useBrushingState) {
      // we don't need to handle events if we're not trying to sync state across
      // chart instances because the line is drawn in the `afterDatasetsDraw`
      // hook even without event handling.
      return
    }

    const { event } = args
    if (event.type === 'mousemove' || event.type === 'mouseout') {
      requestAnimationFrame((time) => this.onMouseBrush(event.type, chart, time))
    }
  }

  private _lastMouseBrushEvent = 0
  onMouseBrush(type: 'mousemove' | 'mouseout', chart: Chart, time: number) {
    if (type === 'mousemove' && (time - this._lastMouseBrushEvent) < EVENT_THROTTLE_MS) {
      // throttled: only do this every EVENT_THROTTLE_MS at most unless it's mouseout
      return
    }

    const redrawOthers = () => {
      brushingState.chart = chart
      brushingState.strategy = this._brushStrategy
      brushingState.group = this._brushGroup

      for (const instance of Object.values(Chartjs.instances)) {
        if (instance !== chart) {
          instance.update('none')
        }
      }
    }

    if (type === 'mousemove') {
      const hasActiveTooltip = chart.tooltip
        && chart.tooltip.getActiveElements()
        && chart.tooltip.getActiveElements().length

      if (hasActiveTooltip) {
        brushingState.x = chart.tooltip.dataPoints[0]?.element?.x
        redrawOthers()
      }
    } else if (type === 'mouseout') {
      brushingState.x = undefined
      redrawOthers()
    }

    this._lastMouseBrushEvent = time
  }

  afterDatasetsDraw(chart: Chart) {
    if (this.isPaused || !chart.scales.y) {
      // we don't draw any vertical lines for any reason when we're paused
      return
    }

    const hasActiveTooltip = chart.tooltip
      && chart.tooltip.getActiveElements()
      && chart.tooltip.getActiveElements().length

    const ctx = chart.ctx

    if (this._clickedSegment) {
      // if we have a clicked segment we always draw the line at that point
      const { x } = (this._clickedSegment as TooltipItem<ChartType>).element
      drawLine(ctx, x, chart.scales.y.top, chart.scales.y.bottom)
    } else if (this._useBrushingState) {
      this.drawByBrush(chart)
    } else if (hasActiveTooltip && chart.tooltip.dataPoints[0]) {
      // otherwise, only draw if we have an active tooltip
      const { x } = chart.tooltip.dataPoints[0].element
      drawLine(ctx, x, chart.scales.y.top, chart.scales.y.bottom)
    }
  }

  drawByBrush(chart: Chart) {
    if (brushingState.x === undefined) return

    // when drawing lines because of a different chart being hovered, draw the
    // same color but only at 30% opacity
    const color = brushingState.chart === chart ? '#0275d8' : 'rgba(2, 117, 216, 0.3)'

    if (this._brushStrategy === 'group' && brushingState.group === this._brushGroup && chart.scales.y) {
      drawLine(chart.ctx, brushingState.x, chart.scales.y.top, chart.scales.y.bottom, color)
    }
  }

  pause() {
    this._pause = true
  }

  resume() {
    this._pause = false
  }

  get isPaused() {
    return this._pause
  }

  set clickedSegment(segment: TooltipItem<ChartType> | undefined) {
    this._clickedSegment = segment
  }
  get clickedSegment(): TooltipItem<ChartType> | undefined {
    return this._clickedSegment
  }

  destroyClickedSegment() {
    delete this._clickedSegment
  }

  beforeDestroy(chart: Chart) {
    if (this._clickedSegment) {
      this.destroyClickedSegment()
    }

    if (this._useBrushingState && brushingState.chart === chart) {
      // if the chart that initialized the brushState is this chart then cleanup
      const hadState = brushingState.x !== undefined
      clearBrushingState()
      if (hadState) {
        // redraw all other charts that may have been affected by this brush state
        for (const instance of Object.values(Chartjs.instances)) {
          if (instance !== chart) {
            instance.update('none')
          }
        }
      }
    }
  }
}

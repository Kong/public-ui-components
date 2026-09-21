import type { Chart, ChartEvent, Plugin } from 'chart.js'
import { inject } from 'vue'
import { INJECT_DASHBOARD_COORDINATOR } from '../../constants'
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

const EVENT_THROTTLE_MS = 10

export class CoordinatorPlugin implements Plugin {
  id = 'coordinator'
  coordinator = null as any
  instanceId = ''
  isTimeseriesX = false

  afterInit(chart: Chart) {
    this.instanceId = crypto.randomUUID()
    this.coordinator = inject(INJECT_DASHBOARD_COORDINATOR, null)
    this.isTimeseriesX = chart.config.options?.scales?.x?.type === 'timeseries'
  }

  afterEvent(chart: Chart, { event }: { event: ChartEvent }) {
    if (event.type === 'mousemove' || event.type === 'mouseout') {
      requestAnimationFrame((time) => this.onMouseBrush(event.native!, chart, time))
    }
  }

  private _lastMouseBrushEvent = 0
  onMouseBrush(event: Event, chart: Chart, time: number) {
    const type = event.type

    if (type === 'mousemove' && (time - this._lastMouseBrushEvent) < EVENT_THROTTLE_MS) {
      // throttled: only do this every EVENT_THROTTLE_MS at most unless it's mouseout
      return
    }

    const redraw = () => {
      // trigger a redraw for all other charts
      for (const instance of Object.values(Chartjs.instances)) {
        if (instance !== chart) {
          instance.draw()
        }
      }
    }

    if (type === 'mousemove') {
      const timestamp = this._getTimestamp(chart, event)
      this.coordinator.setActiveTimestamp(this.instanceId, timestamp)
      redraw()
    } else if (type === 'mouseout') {
      this.coordinator.setActiveTimestamp(this.instanceId, undefined)
      redraw()
    }

    this._lastMouseBrushEvent = time
  }

  afterDatasetsDraw(chart: Chart) {
    if (this.isTimeseriesX
      && this.coordinator?.activeTimestamp?.value
      && this.coordinator?.activeChart.value !== this.instanceId) {
      this._drawTimestamp(chart, this.coordinator.activeTimestamp.value)
    }
  }

  _getTimestamp(chart: Chart, event: Event): number | undefined {
    const [nearestElement] = chart.getElementsAtEventForMode(event, 'index', { intersect: false }, false)
    if (!nearestElement) {
      return
    }

    if (this.isTimeseriesX) {
      const { datasetIndex, index } = nearestElement
      const { x } = chart.data.datasets[datasetIndex].data[index] as { x: number, y: number }
      return x
    }
  }

  _drawTimestamp(chart: Chart, timestamp: number) {
    if (this.isTimeseriesX) {
      const xScale = chart.scales['x']
      const xValue = xScale.getPixelForValue(timestamp)
      const ctx = chart.ctx
      drawLine(ctx, xValue, chart.scales.y.top, chart.scales.y.bottom)
    }
  }
}

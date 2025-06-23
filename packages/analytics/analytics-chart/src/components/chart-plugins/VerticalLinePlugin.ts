import type { Chart, ChartType, Plugin, TooltipItem } from 'chart.js'

const drawLine = (ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number) => {

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, top)
  ctx.lineTo(x, bottom)
  ctx.lineWidth = 1
  ctx.strokeStyle = '#0275d8'
  ctx.stroke()
  ctx.restore()
}
export class VerticalLinePlugin implements Plugin {
  id = 'verticalLinePlugin'
  private _clickedSegment?: TooltipItem<ChartType> | undefined
  private _pause = false

  afterDatasetsDraw(chart: Chart) {
    if (!this._pause && chart.tooltip && chart.tooltip.getActiveElements() && chart.tooltip.getActiveElements().length && !this.clickedSegment) {
      const { x } = chart.tooltip.dataPoints[0].element
      const ctx = chart.ctx
      drawLine(ctx, x, chart.scales.y.top, chart.scales.y.bottom)
    }

    if (!this._pause && this._clickedSegment) {
      const { x } = (this._clickedSegment as TooltipItem<ChartType>).element
      const ctx = chart.ctx
      drawLine(ctx, x, chart.scales.y.top, chart.scales.y.bottom)
    }
  }

  pause() {
    this._pause = true
  }

  resume() {
    this._pause = false
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

  beforeDestroy() {
    if (this._clickedSegment) {
      this.destroyClickedSegment()
    }
  }
}

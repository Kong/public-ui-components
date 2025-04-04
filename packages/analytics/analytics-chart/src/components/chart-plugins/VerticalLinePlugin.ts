import type { Chart, ChartType, Plugin, TooltipItem } from 'chart.js'

interface IVerticalLinePlugin extends Plugin {
  clickedSegment?: TooltipItem<ChartType>
  pause?: boolean
}

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
export class VerticalLinePlugin implements IVerticalLinePlugin {
  id = 'verticalLinePlugin'
  clickedSegment?: TooltipItem<ChartType>
  pause = false

  afterDatasetsDraw(chart: Chart) {
    if (!this.pause && chart.tooltip && chart.tooltip.getActiveElements() && chart.tooltip.getActiveElements().length && !this.clickedSegment) {
      const { x } = chart.tooltip.dataPoints[0].element
      const ctx = chart.ctx
      drawLine(ctx, x, chart.scales.y.top, chart.scales.y.bottom)
    }

    if (!this.pause && this.clickedSegment) {
      const { x } = (this.clickedSegment as TooltipItem<ChartType>).element
      const ctx = chart.ctx
      drawLine(ctx, x, chart.scales.y.top, chart.scales.y.bottom)
    }
  }

  beforeDestroy() {
    delete this.clickedSegment
  }
}

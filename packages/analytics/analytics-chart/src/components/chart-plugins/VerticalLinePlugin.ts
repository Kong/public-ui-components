import type { Chart, ChartType, Plugin, TooltipItem } from 'chart.js'

interface VerticalLinePlugin extends Plugin {
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

export const createVerticalLinePlugin = (): VerticalLinePlugin => ({
  id: 'linePlugin',
  afterDatasetsDraw: function(chartInstance: Chart) {
    if (!this.pause && chartInstance.tooltip && chartInstance.tooltip.getActiveElements() && chartInstance.tooltip.getActiveElements().length && !this.clickedSegment) {
      const { x } = chartInstance.tooltip.dataPoints[0].element
      const ctx = chartInstance.ctx
      drawLine(ctx, x, chartInstance.scales.y.top, chartInstance.scales.y.bottom)
    }

    if (!this.pause && this.clickedSegment) {
      const { x } = (this.clickedSegment as TooltipItem<ChartType>).element
      const ctx = chartInstance.ctx
      drawLine(ctx, x, chartInstance.scales.y.top, chartInstance.scales.y.bottom)
    }
  },
  beforeDestroy() {
    delete this.clickedSegment
  },
})

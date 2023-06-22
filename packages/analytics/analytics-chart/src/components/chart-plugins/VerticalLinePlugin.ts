import { Chart } from 'chart.js'

export const verticalLinePlugin = {
  id: 'linePlugin',
  afterDatasetsDraw: function(chartInstance: Chart) {
    if (chartInstance.tooltip && chartInstance.tooltip.getActiveElements() && chartInstance.tooltip.getActiveElements().length) {
      const { x } = chartInstance.tooltip.dataPoints[0].element

      const ctx = chartInstance.ctx

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, chartInstance.scales.y.top)
      ctx.lineTo(x, chartInstance.scales.y.bottom)
      ctx.lineWidth = 1
      ctx.strokeStyle = '#0275d8'
      ctx.stroke()
      ctx.restore()
    }
  },
}

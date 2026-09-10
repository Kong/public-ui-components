import type { Chart, Plugin } from 'chart.js'

interface OutlierBandOptions {
  // Metric value above which the plot area is shaded
  value?: number
  // Fill for the shaded region
  color?: string
}

/**
 * Shades the region of a scatter chart above the outlier threshold.
 */
export class OutlierBandPlugin implements Plugin {
  id = 'outlierBandPlugin'

  beforeDatasetsDraw(chart: Chart, _: any, pluginOptions: OutlierBandOptions): void {
    const value = pluginOptions?.value

    if (value === undefined || !Number.isFinite(value) || !pluginOptions?.color) {
      return
    }

    const yScale = chart.scales.y

    if (!yScale || !chart.chartArea) {
      return
    }

    const { top, bottom, left, right } = chart.chartArea
    const chartBottom = Math.min(Math.max(yScale.getPixelForValue(value), top), bottom)

    if (chartBottom <= top) {
      return
    }

    const context = chart.ctx

    context.save()
    context.fillStyle = pluginOptions.color
    context.fillRect(left, top, right - left, chartBottom - top)
    context.restore()
  }
}

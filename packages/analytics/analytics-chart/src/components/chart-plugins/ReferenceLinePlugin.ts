import type { Chart, Plugin } from 'chart.js'
import type { ResolvedReferenceLine } from '../../types'

interface ReferenceLineOptions {
  lines?: ResolvedReferenceLine[]
}

const LINE_WIDTH = 1.5

/** Draws horizontal reference lines across a chart */
export class ReferenceLinePlugin implements Plugin {
  id = 'referenceLinePlugin'

  // `after`, not `before`: a reference line has to read on top of a bunch of points
  afterDatasetsDraw(chart: Chart, _: any, pluginOptions: ReferenceLineOptions): void {
    const lines = pluginOptions?.lines

    if (!lines?.length) {
      return
    }

    const yScale = chart.scales.y

    if (!yScale || !chart.chartArea) {
      return
    }

    const { top, bottom, left, right } = chart.chartArea
    const context = chart.ctx

    context.save()
    context.lineWidth = LINE_WIDTH

    for (const { value, color, borderDash } of lines) {
      if (!Number.isFinite(value)) {
        continue
      }

      const y = yScale.getPixelForValue(value)

      // A line outside the plotted range would otherwise be drawn over an axis
      if (y < top || y > bottom) {
        continue
      }

      context.beginPath()
      context.setLineDash(borderDash)
      context.strokeStyle = color
      context.moveTo(left, y)
      context.lineTo(right, y)
      context.stroke()
    }

    context.restore()
  }
}

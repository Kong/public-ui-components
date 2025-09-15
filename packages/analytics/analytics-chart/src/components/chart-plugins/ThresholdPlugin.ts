import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { KUI_FONT_FAMILY_TEXT } from '@kong/design-tokens'
import type { Chart, Plugin } from 'chart.js'
import type { Threshold } from 'src/types'
import type { createI18n } from '@kong-ui-public/i18n'
import type english from '../../locales/en.json'
import { thresholdColor } from '../../utils'

interface ThresholdOptions {
  threshold: Record<ExploreAggregations, Threshold[]> | undefined
}
export class ThresholdPlugin implements Plugin {
  id = 'thresholdPlugin'

  constructor(private i18n: ReturnType<typeof createI18n<typeof english>>) {}

  afterDatasetDraw(chart: Chart, _: any, pluginOptions: ThresholdOptions): void {
    for (const key of Object.keys(pluginOptions.threshold || {})) {
      const threshold = pluginOptions.threshold?.[key as ExploreAggregations]

      if (threshold) {
        threshold.forEach((t) => {
          const yScale = chart.scales['y']
          const yValue = yScale.getPixelForValue(t.value)

          const context = chart.ctx
          context.save()
          context.beginPath()
          context.moveTo(chart.chartArea.left, yValue)
          context.lineTo(chart.chartArea.right, yValue)
          context.lineWidth = 1
          context.strokeStyle = thresholdColor(t.type)
          context.setLineDash([5, 5])
          context.stroke()
          context.restore()

          const text = t.type === 'warning'
            ? this.i18n.t('chartLabels.threshold-warning', { value: t.value })
            : t.type === 'error'
              ? this.i18n.t('chartLabels.threshold-error', { value: t.value })
              : this.i18n.t('chartLabels.thatreshold-neutral', { value: t.value })

          context.save()
          context.fillStyle = thresholdColor(t.type)
          context.font = KUI_FONT_FAMILY_TEXT
          context.fillText(text, chart.chartArea.left, yValue - 4)
          context.restore()
        })
      }
    }
  }
}

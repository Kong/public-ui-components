import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { KUI_FONT_FAMILY_TEXT } from '@kong/design-tokens'
import type { Chart, Plugin } from 'chart.js'
import type { Threshold } from 'src/types'
import type { createI18n } from '@kong-ui-public/i18n'
import type english from '../../locales/en.json'
import { thresholdColor } from '../../utils'

const HOVER_TRIGGER_DELTA = 20

interface ThresholdOptions {
  threshold: Record<ExploreAggregations, Threshold[]> | undefined
}

type ThresholdExtra = Threshold & {
  hovered?: boolean
}
export class ThresholdPlugin implements Plugin {
  id = 'thresholdPlugin'
  private _thresholds?: Record<ExploreAggregations, ThresholdExtra[]>
  private _mouseMoveHandler?: ((event: MouseEvent) => void)

  constructor(private i18n: ReturnType<typeof createI18n<typeof english>>) {}

  beforeInit(chart: Chart, _: any, pluginOptions: ThresholdOptions): void {
    const canvas = chart.canvas
    for (const key of Object.keys(pluginOptions.threshold || {})) {
      const threshold = pluginOptions.threshold?.[key as ExploreAggregations]
      if (threshold) {
        this._thresholds = {
          ...this._thresholds,
          [key as ExploreAggregations]: threshold.map((t) => ({ ...t, hovered: false })),
        } as Record<ExploreAggregations, ThresholdExtra[]>
      }
    }

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

  afterDatasetDraw(chart: Chart): void {
    for (const key of Object.keys(this._thresholds || {})) {
      const threshold = this._thresholds?.[key as ExploreAggregations]

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
      }
    }
  }

  beforeDestroy(chart: Chart): void {
    if (this._mouseMoveHandler) {
      chart.canvas.removeEventListener('mousemove', this._mouseMoveHandler)
    }
  }
}

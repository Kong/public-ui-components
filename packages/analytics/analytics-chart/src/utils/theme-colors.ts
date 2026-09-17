import { color } from 'chart.js/helpers'
import {
  KUI_COLOR_BACKGROUND_DANGER,
  KUI_COLOR_BACKGROUND_DANGER_WEAKEST,
  KUI_COLOR_TEXT,
} from '@kong/design-tokens'

const OUTLIER_BAND_ALPHA = 0.7

export interface ScatterChartColors {
  medianLine: string
  outlier: string
  outlierBand: string
}

export const withAlpha = (value: string, alpha: number): string => {
  const parsed = color(value.trim())

  if (!parsed.valid) {
    return value
  }

  return parsed.alpha(alpha).rgbString()
}

export const scatterChartColors = (element?: Element | null): ScatterChartColors => {
  const target = element ?? (typeof document === 'undefined' ? null : document.documentElement)

  if (typeof window === 'undefined' || !target) {
    return {
      medianLine: KUI_COLOR_TEXT,
      outlier: KUI_COLOR_BACKGROUND_DANGER,
      outlierBand: withAlpha(KUI_COLOR_BACKGROUND_DANGER_WEAKEST, OUTLIER_BAND_ALPHA),
    }
  }

  const styles = window.getComputedStyle(target)

  const getColor = (customProperty: string, fallback: string): string => (
    styles.getPropertyValue(customProperty).trim() || fallback
  )

  return {
    medianLine: getColor('--kui-color-text', KUI_COLOR_TEXT),
    outlier: getColor('--kui-color-background-danger', KUI_COLOR_BACKGROUND_DANGER),
    outlierBand: withAlpha(
      getColor('--kui-color-background-danger-weakest', KUI_COLOR_BACKGROUND_DANGER_WEAKEST),
      OUTLIER_BAND_ALPHA,
    ),
  }
}

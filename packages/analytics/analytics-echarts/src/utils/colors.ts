import { KUI_COLOR_BACKGROUND_NEUTRAL, KUI_COLOR_TEXT_DANGER, KUI_COLOR_TEXT_WARNING_WEAK } from '@kong/design-tokens'
import type { ThresholdType } from '../types'
interface AnalyticsChartColors {
  [dimensionValue: string]: string
}

export const datavisPalette = [
  '#a86cd5',
  '#6a86d2',
  '#00bbf9',
  '#00c4b0',
  '#ffdf15',
]

// Wrap around if we run out of colors.
export const lookupDatavisColor = (idx: number, customPalette?: string[]) => {
  const colorLookup = customPalette || datavisPalette
  return colorLookup[idx % datavisPalette.length]
}

const EMPTY_COLOR = '#afb7c5'

export const determineBaseColor = (i: number, dimensionName: string, isEmpty: boolean, colorPalette: string[] | AnalyticsChartColors): string => {
  let baseColor

  if (isEmpty) {
    baseColor = EMPTY_COLOR
  } else if (Array.isArray(colorPalette)) {
    baseColor = lookupDatavisColor(i, colorPalette)
  } else {
    baseColor = colorPalette[dimensionName]
  }

  return baseColor || lookupDatavisColor(i) // fallback to default datavis palette if no color found
}

export const thresholdColor = (type: ThresholdType): string => {
  switch (type) {
    case 'error':
      return KUI_COLOR_TEXT_DANGER
    case 'warning':
      return KUI_COLOR_TEXT_WARNING_WEAK
    case 'neutral':
      return KUI_COLOR_BACKGROUND_NEUTRAL
    default:
      return KUI_COLOR_BACKGROUND_NEUTRAL
  }
}

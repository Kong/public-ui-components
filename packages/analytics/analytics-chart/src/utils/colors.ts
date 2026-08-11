import {
  KUI_COLOR_BACKGROUND_NEUTRAL,
  KUI_COLOR_BACKGROUND_NEUTRAL_WEAK,
  KUI_COLOR_TEXT_DANGER,
  KUI_COLOR_TEXT_WARNING_WEAK,
} from '@kong/design-tokens'
import type { AnalyticsChartColors, ThresholdType } from '../../src/types'

interface StatusCodeColor {
  background: string
  text: string
}
interface StatusCodeColors {
  [statusCode: number]: StatusCodeColor
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

export const accessibleGrey = '#6f7787' // grey-500

// Deprecated: API Requests still depends on this legacy color map.
// TODO: Remove once API Requests uses status-code variant KBadges instead.
const apiRequestStatusCodeColors: StatusCodeColors = {
  100: { background: '#f0f5fd', text: '#10599e' },
  200: { background: '#e5f7f4', text: '#1b6955' },
  300: { background: '#fff1d5', text: '#a06027' },
  400: { background: '#fee3b6', text: '#944d19' },
  500: { background: '#fedada', text: '#852021' },
}

export const statusCodeBadgeBackgroundColor = (statusCode: string) => {
  const keyIndex = Math.floor(parseInt(statusCode, 10) / 100) * 100

  return apiRequestStatusCodeColors[keyIndex]?.background || '#fafafa'
}

const EMPTY_COLOR = KUI_COLOR_BACKGROUND_NEUTRAL_WEAK

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

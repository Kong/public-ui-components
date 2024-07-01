import type { AnalyticsChartColors } from '../../src/types'
import {
  KUI_STATUS_COLOR_1XX,
  KUI_STATUS_COLOR_2XX,
  KUI_STATUS_COLOR_3XX,
  KUI_STATUS_COLOR_4XX,
  KUI_STATUS_COLOR_5XX,
} from '@kong/design-tokens'
interface StatusCodeColor {
  background: string;
  text: string;
}
interface StatusCodeColors {
  [statusCode: number]: StatusCodeColor;
}

// Collection of colors matching existing Kong Manager Status Code chart
const kongManangerColorPalette = {
  '1XXCount|1XX|1[0-9][0-9]': { solid: '#0072E5', light: '#4DA6FF', description: 'Informational' },
  'SuccessfulRequests|2XXCount|2XX|2[0-9][0-9]|SUCCESS': { solid: '#0BB652', light: '#6FCC83', description: 'Success' },
  '3XXCount|3XX|3[0-9][0-9]': { solid: '#FDC53B', light: '#FFD982', description: 'Redirection' },
  '4XXCount|4XX|4[0-9][0-9]': { solid: '#FE9439', light: '#FFBA81', description: 'Client Errors' },
  '5XXCount|5XX|5[0-9][0-9]': { solid: '#FF4545', light: '#FF8484', description: 'Server Errors' },
  'errorCount|FailedRequests|FAILURE': { solid: '#FF4545', light: '#FF8484', description: 'Server Errors' },
  nonStandard: { solid: '#6f7787', light: '#e7e7ec' }, // grey-500, grey-300
  standard: { solid: '#1155cb', light: '#8ab3fa' }, // blue-500, blue-300,
  p99: { solid: '#1356cb', light: '#1356cb' },
  p95: { solid: '#1fbecd', light: '#1fbecd' },
  p50: { solid: '#1df97d', light: '#1df97d' },
  LatencyP99: { solid: '#1356cb', light: '#1356cb' },
  LatencyP95: { solid: '#1fbecd', light: '#1fbecd' },
  LatencyP50: { solid: '#1df97d', light: '#1df97d' },
}

export const datavisPalette = [
  KUI_STATUS_COLOR_1XX,
  KUI_STATUS_COLOR_2XX,
  KUI_STATUS_COLOR_3XX,
  KUI_STATUS_COLOR_4XX,
  KUI_STATUS_COLOR_5XX,
]

// Wrap around if we run out of colors.
export const lookupDatavisColor = (idx: number, customPalette?: string[]) => {
  const colorLookup = customPalette || datavisPalette
  return colorLookup[idx % datavisPalette.length]
}

export const darkenColor = (hex: string, amt: number): string => {
  if (hex[0] === '#') {
    hex = hex.slice(1)
  }

  let R = parseInt(hex.substring(0, 2), 16)
  let G = parseInt(hex.substring(2, 4), 16)
  let B = parseInt(hex.substring(4, 6), 16)

  R = R - amt
  G = G - amt
  B = B - amt

  if (R > 255) {
    R = 255
  } else if (R < 0) {
    R = 0
  }

  if (G > 255) {
    G = 255
  } else if (G < 0) {
    G = 0
  }

  if (B > 255) {
    B = 255
  } else if (B < 0) {
    B = 0
  }

  const RR = ((R.toString(16).length === 1) ? '0' + R.toString(16) : R.toString(16))
  const GG = ((G.toString(16).length === 1) ? '0' + G.toString(16) : G.toString(16))
  const BB = ((B.toString(16).length === 1) ? '0' + B.toString(16) : B.toString(16))

  return `#${RR}${GG}${BB}`
}

export const accessibleGrey = '#6f7787' // grey-500

export const apiRequestStatusCodeColors: StatusCodeColors = {
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

export const trafficColors: AnalyticsChartColors = {
  SUCCESS: '#6FCC83',
  FAILURE: '#FF8484',
}

export const errorRateColors: AnalyticsChartColors = {
  '4XX': '#FFBA81',
  '5XX': '#FF8484',
}

export const latencyColors: AnalyticsChartColors = {
  LatencyP99: '#1356cb',
  LatencyP95: '#1fbecd',
  LatencyP50: '#1df97d',
}

export const OTHERS_COLOR = '#dad4c7'

/**
 * Maps the first character of a dataset's label to a predefined list of colors
 */
export const lookupColor = (label: string) => {
  const found = Object.entries(kongManangerColorPalette).find(([key]) => (new RegExp(key).test(label)))

  return (found && found[1]) || kongManangerColorPalette.standard
}

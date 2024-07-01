import type { AnalyticsChartColors } from 'src/types'
import {
  KUI_STATUS_COLOR_1XX,
  KUI_STATUS_COLOR_2XX,
  KUI_STATUS_COLOR_3XX,
  KUI_STATUS_COLOR_4XX,
  KUI_STATUS_COLOR_5XX,
  KUI_STATUS_COLOR_100, KUI_STATUS_COLOR_101, KUI_STATUS_COLOR_102, KUI_STATUS_COLOR_103,
  KUI_STATUS_COLOR_200, KUI_STATUS_COLOR_201, KUI_STATUS_COLOR_202, KUI_STATUS_COLOR_203, KUI_STATUS_COLOR_204, KUI_STATUS_COLOR_205, KUI_STATUS_COLOR_206,KUI_STATUS_COLOR_207,KUI_STATUS_COLOR_208,
  KUI_STATUS_COLOR_300,
  KUI_STATUS_COLOR_400,
  KUI_STATUS_COLOR_500,
} from '@kong/design-tokens'

export const lightGrey = '#e0e4ea' // kui-color-background-disabled

// Note: the first color of each palette is reserved for "out of spec" codes.  The remaining colors
// are for in-spec codes.  For cases where there are more status codes than colors, the colors restart from
// the beginning.
// The algorithm assigns status codes consistent colors, regardless of which codes are present in a given
// chart.  This is a tradeoff: in rare cases, it can lead to (for example) two codes with the same color
// ending up next to each other.
const statusCodePalette: { [label: string]: string[] } = {
  100: [KUI_STATUS_COLOR_100, KUI_STATUS_COLOR_101, KUI_STATUS_COLOR_102, KUI_STATUS_COLOR_103, '#0072e5', '#0059b2'],
  200: [KUI_STATUS_COLOR_200, KUI_STATUS_COLOR_201, KUI_STATUS_COLOR_202, KUI_STATUS_COLOR_203, KUI_STATUS_COLOR_204, KUI_STATUS_COLOR_205, KUI_STATUS_COLOR_206, KUI_STATUS_COLOR_207, KUI_STATUS_COLOR_208, KUI_STATUS_COLOR_208],
  300: [KUI_STATUS_COLOR_300, '#ffe9b8', '#ffe2a1', '#ffd982', '#ffd062', '#fdc53b', '#f4bb1e', '#e8b00b', '#d9a30f', '#c89407'],
  400: [KUI_STATUS_COLOR_400, '#ffd5b1', '#ffc899', '#ffba81', '#ffae6b', '#fe9439', '#f6871d', '#eb7c0c', '#da700c', '#cc6100'],
  500: [KUI_STATUS_COLOR_500, '#ffb6b6', '#ff9d9d', '#ff8484', '#ff6a6a', '#ff4545', '#fb1f1f', '#e90b0b', '#d40202', '#be0202'],
}

const colorsForCodes = (codeClass: string, codes: number[]) => {
  let i = 1
  const palette = statusCodePalette[codeClass]

  const ret: Map<number, string> = new Map()

  // Assign each in-spec code a color.  Skip the first color (index 0) in the palette;
  // it's reserved for out-of-spec codes.
  for (const num of codes) {
    ret.set(num, palette[i])
    i = i % (palette.length - 1) + 1
  }

  // Assign the color for out-of-spec codes.
  ret.set(-1, palette[0])

  return ret
}

// Note: in addition to the colors, this map currently drives the available status codes
// in the reports v2 filter list.  Eventually, hopefully, we'll have server-side search
// and this won't be necessary.
export const codesInSpec = new Map([
  [100, colorsForCodes('100', [100, 101, 102, 103])],
  [200, colorsForCodes('200', [200, 201, 202, 203, 204, 205, 206, 207, 208, 226])],
  [300, colorsForCodes('300', [300, 301, 302, 303, 304, 305, 307, 308])],
  [400, colorsForCodes('400', [
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416,
    417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
  ])],
  [500, colorsForCodes('500', [500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511])],
])

export const lookupStatusCodeColor = (label: string) => {
  const code = parseInt(label, 10)
  const codeClass = Math.floor(code / 100) * 100
  const palette = codesInSpec.get(codeClass)

  if (palette === undefined) {
    return lightGrey
  }

  // For in-spec codes, pick a color.  For out-of-spec codes, pick the fallback color.
  const color = palette.get(code) ?? palette.get(-1) ?? lightGrey

  return color
}

export const lookupStatusCodeCategoryColor = (label: string) => {
  const color = lookupStatusCodeColor(label)

  return { solid: color, light: color }
}

const statusCodes = Array.from({ length: 500 }, (_, index) => 100 + index)

export const defaultStatusCodeColors: AnalyticsChartColors = {
  ...statusCodes.reduce((acc, statusCode) => {
    acc[`${statusCode}`] = lookupStatusCodeColor(`${statusCode}`)

    return acc

  }, {} as AnalyticsChartColors),
  ____OTHER____: '#DAD4C7',
  '1XX': KUI_STATUS_COLOR_1XX,
  '2XX': KUI_STATUS_COLOR_2XX,
  '3XX': KUI_STATUS_COLOR_3XX,
  '4XX': KUI_STATUS_COLOR_4XX,
  '5XX': KUI_STATUS_COLOR_5XX,
}

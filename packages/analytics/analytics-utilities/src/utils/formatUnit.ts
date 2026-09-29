import type { IntlShapeEx } from '@kong-ui-public/i18n'
// @ts-ignore - approximate-number no exported module
import approxNum from 'approximate-number'

// Guard against SSR/non-browser contexts where `document` is undefined
const defaultLocale = (typeof document !== 'undefined' && document.documentElement?.lang) || 'en-US'

export const numberFormatter = new Intl.NumberFormat(defaultLocale)

// How a unit sits against its number: flush ("42%") or spaced ("250 ms").
// Magnitude suffixes from `approximate` (K/M/B) are always flush and are part of the number.
export type UnitPlacement = 'flush' | 'spaced'

const FLUSH_UNITS: ReadonlySet<string> = new Set(['%'])

export const unitPlacement = (unit: string): UnitPlacement => FLUSH_UNITS.has(unit) ? 'flush' : 'spaced'

export function unitFormatter<T extends Record<string, any>>({
  i18n,
} : {
  i18n: IntlShapeEx<T>
}) {

  const formatBytes = (value: number, isBytes1024?: boolean): string => {
    if (isNaN(value)) {
      return '0 B'
    }

    const pb = isBytes1024 ? Math.pow(2, 50) : 1e15
    const tb = isBytes1024 ? Math.pow(2, 40) : 1e12
    const gb = isBytes1024 ? Math.pow(2, 30) : 1e9
    const mb = isBytes1024 ? Math.pow(2, 20) : 1e6
    const kb = isBytes1024 ? Math.pow(2, 10) : 1e3

    let out

    if (value >= pb) {
      out = i18n.formatNumber(
        Number.parseFloat((value / pb).toPrecision(3)),
        { style: 'unit', unit: 'petabyte', unitDisplay: 'narrow' },
      )
    } else if (value >= tb) {
      out = i18n.formatNumber(
        Number.parseFloat((value / tb).toPrecision(3)),
        { style: 'unit', unit: 'terabyte', unitDisplay: 'narrow' },
      )
    } else if (value >= gb) {
      out = i18n.formatNumber(
        Number.parseFloat((value / gb).toPrecision(3)),
        { style: 'unit', unit: 'gigabyte', unitDisplay: 'narrow' },
      )
    } else if (value >= mb) {
      out = i18n.formatNumber(
        Number.parseFloat((value / mb).toPrecision(3)),
        { style: 'unit', unit: 'megabyte', unitDisplay: 'narrow' },
      )
    } else if (value >= kb) {
      out = i18n.formatNumber(
        Number.parseFloat((value / kb).toPrecision(3)),
        { style: 'unit', unit: 'kilobyte', unitDisplay: 'narrow' },
      )
    } else {
      out = i18n.formatNumber(
        Number.parseFloat((value).toPrecision(3)),
        { style: 'unit', unit: 'byte', unitDisplay: 'narrow' },
      )
    }

    // i18n.formatNumber formats it as `10.77kB` but we want `10.77 kB`
    return out.replace(/([a-zA-Z]*)$/, ' $1')
  }

  const formatCost = (value: number, currency: string = 'USD'): string => {
    if (isNaN(value)) {
      return currency === 'USD' ? '$0.00' : `${value}`
    }

    if (value >= 0.01 || currency !== 'USD') {
      return i18n.formatNumber(value, { style: 'currency', currency })
    }

    if (value < 0.0001) {
      return '< $0.0001'
    }

    // when currency is USD, special case handling for 0.0001 to 0.01
    return `$${Number.parseFloat(value.toPrecision(4))}`

  }

  const withUnit = (formatted: string, rawUnit: string, translatedUnit: string): string => {
    if (!translatedUnit) {
      return formatted
    }

    const separator = unitPlacement(rawUnit) === 'flush' ? '' : ' '

    return `${formatted}${separator}${translatedUnit}`
  }

  type FormatNumberOptions = {
    isBytes1024?: boolean
    currency?: string
    // not supported for bytes or currency formatting
    approximate?: boolean
    translateUnit?: (unit: string, value: number) => string
  }

  /*
   * currently the units supported are those returned from the backend
   */
  const formatUnit = (value: number, unit: string, {
    isBytes1024 = false,
    currency = 'USD',
    approximate = false,
    translateUnit = (unit: string) => unit,
  }: FormatNumberOptions = {}): string => {
    const translatedUnit = translateUnit(unit, value)

    switch (unit) {
      case 'bytes':
        return formatBytes(value, isBytes1024)
      case 'usd':
        return formatCost(value, currency)
      case 'ms':
      case 'count/minute':
      case 'token count':
      case 'count':
      default: {
        if (isNaN(value)) {
          return `${value}`
        }
        if (approximate) {
          return withUnit(approxNum(value, { capital: true }), unit, translatedUnit)
        }
        if (value < 0.01) {
          return withUnit(`${Number.parseFloat(value.toPrecision(4))}`, unit, translatedUnit)
        }

        return withUnit(numberFormatter.format(Number.parseFloat(value.toFixed(2))), unit, translatedUnit)
      }
    }
  }

  const formatRange = (min: number, max: number, unit: string, {
    isBytes1024 = false,
    currency = 'USD',
    approximate = false,
    translateUnit = (unit: string) => unit,
  }: FormatNumberOptions = {}): string => {

    const translatedUnit = translateUnit(unit, max)

    switch (unit) {
      case 'bytes':
        return `${formatBytes(min, isBytes1024)} - ${formatBytes(max, isBytes1024)}`
      case 'usd':
        return `${formatCost(min, currency)} - ${formatCost(max, currency)}`
      case 'ms':
      case 'count/minute':
      case 'token count':
      case 'count':
      default:
        if (isNaN(min) || isNaN(max)) {
          return `${min} - ${max}`
        }
        if (approximate) {
          return withUnit(`${approxNum(min, { capital: true })} - ${approxNum(max, { capital: true })}`, unit, translatedUnit)
        }
    }
    const minVal = min >= 0.01
      ? `${numberFormatter.format(Number.parseFloat(min.toFixed(2)))}`
      : `${Number.parseFloat(min.toPrecision(4))}`

    const maxVal = max >= 0.01
      ? `${numberFormatter.format(Number.parseFloat(max.toFixed(2)))}`
      : `${Number.parseFloat(max.toPrecision(4))}`

    return withUnit(`${minVal} - ${maxVal}`, unit, translatedUnit)
  }

  return { formatUnit, formatBytes, formatCost, formatRange }
}

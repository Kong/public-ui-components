import composables from '../composables'
import { numberFormatter } from './constants'

export const formatBytes = (value: number, isBytes1024?: boolean): string => {
  if (isNaN(value)) {
    return '0 B'
  }

  const { i18n } = composables.useI18n()

  const pb = isBytes1024 ? 1125899906842624 : 1000000000000000
  const tb = isBytes1024 ? 1099511627776 : 1000000000000
  const gb = isBytes1024 ? 1073741824 : 1000000000
  const mb = isBytes1024 ? 1048576 : 1000000
  const kb = isBytes1024 ? 1024 : 1000

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

export const formatCost = (value: number, currency: string = 'USD'): string => {
  if (isNaN(value)) {
    return currency === 'USD' ? '$0.00' : `${value}`
  }

  const { i18n } = composables.useI18n()

  if (value >= 0.01 || currency !== 'USD') {
    return i18n.formatNumber(value, { style: 'currency', currency })
  }

  if (value < 0.0001) {
    return '< $0.0001'
  }

  // when currency is USD, special case handling for 0.0001 to 0.01
  return `$${Number.parseFloat(value.toPrecision(4))}`

}

type FormatNumberOptions = {
  isBytes1024?: boolean
  currency?: string
  translateUnit?: (unit: string, value: number) => string
}

/*
 * currently the units supported are those returned from
 * https://github.com/Kong/kanalytics/blob/main/src/druid/druid.service.ts#L58-L73
 */
export const formatUnit = (value: number, unit: string, {
  isBytes1024 = false,
  currency = 'USD',
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
    default:
      if (isNaN(value)) {
        return `${value}`
      }
      return value >= 0.01
        ? `${numberFormatter.format(Number.parseFloat(value.toFixed(2)))} ${translatedUnit}`
        : `${Number.parseFloat(value.toPrecision(4))} ${translatedUnit}`
  }
}

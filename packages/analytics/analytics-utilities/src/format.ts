import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export interface TimeFormatOptions {
  includeTZ?: boolean
  tz?: string
  short?: boolean
}

export function formatISOTimeWithTZ(ts: number | Date) {
  return format(ts, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
}

export function formatTime(ts: number, options: TimeFormatOptions = {}) {
  if (!ts) {
    return ts
  }

  const tz = options.tz || Intl.DateTimeFormat().resolvedOptions().timeZone

  try {
    let timeFormat = 'MMM dd, YYY hh:mm a'
    if (options.short) {
      timeFormat = 'MMM dd, YYY'
    }

    if (options.includeTZ) {
      timeFormat += ' (z)'
    }

    const date = new Date(ts)

    // Note: We always need to use `formatInTimeZone` (rather than plain `format`)
    // in order to achieve consistent results based on the tz of the current computer.
    // Otherwise, unit tests can fail depending on the tz of the dev's computer (or in CI), etc.
    // Even if we don't care about timezones, timezones care about us.  :/
    return formatInTimeZone(date, tz, timeFormat)
  } catch (exc) {
    console.error('Invalid value passed to formatTime', ts)

    return '(invalid date)'
  }
}

export function formatTimeRange(start: Date, end: Date) {
  return `${formatTime(start.getTime())} - ${formatTime(end.getTime(), { includeTZ: true })}`
}

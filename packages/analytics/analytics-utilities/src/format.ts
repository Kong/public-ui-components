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

export function formatTime(ts: number | string, options: TimeFormatOptions = {}) {
  if (!ts) {
    return ts
  }

  const tz = options.tz || Intl.DateTimeFormat().resolvedOptions().timeZone

  try {
    let timeFormat = 'MMM dd, yyy hh:mm a'
    if (options.short) {
      timeFormat = 'MMM dd, yyy'
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
  } catch {
    console.error('Invalid value passed to formatTime', ts)

    return '(invalid date)'
  }
}

/**
 * Formatted display for a start and end time range
 * @param start Date from
 * @param end Date to
 * @returns Human-readable date range string
 */
export function formatTimeRange(start: Date, end: Date) {
  return `${formatTime(start.getTime())} - ${formatTime(end.getTime(), { includeTZ: true })}`
}

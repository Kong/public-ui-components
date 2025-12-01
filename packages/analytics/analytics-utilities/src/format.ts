import { formatInTimeZone } from 'date-fns-tz'

export interface TimeFormatOptions {
  includeTZ?: boolean
  tz?: string
  short?: boolean
  format?: 'default' | 'short' | 'full'
}

/**
 *Formats a timestamp according to the specified options
 *
 * @param ts - timestamp as number or Date
 * @param options - formatting options
 * @param options.format - format of the timestamp representing the granularity
 * 'MMM dd, yyyy hh:mm a' (default)
 * Possible values:
 * - short:   'MMM dd, yyyy'
 * - default:  'MMM dd, yyyy hh:mm a'
 * - full:      'MMM dd, yyyy hh:mm:ss.SSS a'
 * @param options.includeTZ: whether to include the timezone abbreviation in the formatted string
 * @param options.tz: timezone to use for formatting (defaults to system timezone)
 * @returns Formatted timestamp string
 */
export function formatTimestamp(ts: number | Date, options: TimeFormatOptions = {}) {
  const tz = options?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone
  let format = 'MMM dd, yyy hh:mm a'

  switch (options.format) {
    case 'short':
      format = 'MMM dd, yyyy'
      break
    case 'default':
      format = 'MMM dd, yyyy hh:mm a'
      break
    case 'full':
      format = 'MMM dd, yyyy hh:mm:ss.SSS a'
      break
  }

  if (options.includeTZ) {
    format += ' (z)'
  }

  return formatInTimeZone(ts, tz, format)
}

/**
 * @deprecated use `formatTimestamp` instead
 */
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

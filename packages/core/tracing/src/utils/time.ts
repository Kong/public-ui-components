export const getDurationFormatter = (locales: Intl.LocalesArgument = 'en') => {
  const fmt = new Intl.NumberFormat(locales, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return (nanoseconds?: number) => {
    if (nanoseconds === undefined || Number.isNaN(nanoseconds)) {
      return 'N/A'
    }

    let t = nanoseconds

    if (t < 1000) {
      return `${fmt.format(t)}ns`
    }

    if ((t /= 1000) < 1000) {
      return `${fmt.format(t)}µs`
    }

    if ((t /= 1000) < 1000) {
      return `${fmt.format(t)}ms`
    }

    if ((t /= 1000) < 1000) {
      return `${fmt.format(t)}s`
    }

    if ((t /= 60) < 60) {
      return `${fmt.format(t)}m`
    }

    return `${fmt.format(t / 60)}h`
  }
}

/**
 * Latencies are rounded up and formatted in milliseconds with one decimal place.
 */
export const formatLatency = (milliseconds?: number) => {
  if (milliseconds === undefined || Number.isNaN(milliseconds)) {
    return 'N/A'
  }

  return `${Math.round(milliseconds * 10 + Number.EPSILON) / 10}ms`
}

/**
 * This function formats a nanosecond duration into a human-readable string.
 * The output string will use the local time zone.
 *
 * Example output: `2024-12-09 13:31:47.476672512`
 *
 * @param unixNano UNIX timestamp in nanoseconds
 * @returns an formatted date and time string with nanoseconds precision
 */
export const formatNanoDateTimeString = (unixNano?: bigint) => {
  if (unixNano === undefined) {
    return 'N/A'
  }

  const ms = unixNano / BigInt(1e6)
  const date = new Date(Number(ms))

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  const nanoseconds = (unixNano - ms * BigInt(1e6)).toString().padStart(6, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${nanoseconds}`
}

import { format } from 'date-fns'

export default function useDate() {
  /**
 * The function to format date by specific config
 * @param {number} seconds value to format
 * @param {Intl.DateTimeFormatOptions} options options for setting specific date format
 * @return {string | null} formatted date
 */
  const formatDateBy = (seconds: number, options: Intl.DateTimeFormatOptions = {}): string | null => {
    if (isNaN(seconds)) {
      return null
    }

    try {
      const date = new Date(seconds * 1000)

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        ...options,
      })
    } catch (err) {
      return null
    }
  }

  /**
   * Formats a unix timestamp into a formatted date string via the `format` method from `date-fns`
   * @param {Number} timestamp a unix timestamp in seconds
   * @returns {string} A date string with format YYYY-MM-DD HH:mm:ss ZZ or empty string when there is an error parsing
   */
  const formatUnixToDate = (timestamp: number, omitTimezone?: boolean): string => {
    if (!timestamp) {
      return ''
    }

    const dateFormatString = !omitTimezone ? 'yyyy-MM-dd HH:mm:ss XX' : 'yyyy-MM-dd HH:mm:ss'

    try {
      const date = new Date(timestamp * 1000)

      return format(date, dateFormatString)
    } catch (err) {
      return ''
    }
  }

  return {
    formatDateBy,
    formatUnixToDate,
  }
}

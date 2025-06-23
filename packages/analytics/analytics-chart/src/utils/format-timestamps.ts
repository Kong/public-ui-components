import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import { formatInTimeZone } from 'date-fns-tz'

export const formatByGranularity = (
  tickValue: Date,
  granularity: GranularityValues,
  dayBoundaryCrossed: boolean,
  timezone?: string,
): string => {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  switch (granularity) {
    case 'secondly':
    case 'tenSecondly':
    case 'thirtySecondly':
      return formatInTimeZone(tickValue, tz, dayBoundaryCrossed ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a')
    case 'minutely':
    case 'fiveMinutely':
    case 'tenMinutely':
    case 'thirtyMinutely':
    case 'hourly':
    case 'twoHourly':
      return formatInTimeZone(tickValue, tz, dayBoundaryCrossed ? 'yyyy-MM-dd h:mm a' : 'h:mm a')
    case 'twelveHourly':
      return formatInTimeZone(tickValue, tz, 'yyyy-MM-dd h:mm a')
    case 'daily':
      return formatInTimeZone(tickValue, tz, 'yyyy-MM-dd')
    case 'weekly':
      return `${formatInTimeZone(tickValue, tz, 'yyyy')} W${formatInTimeZone(tickValue, tz, 'II')}`
    default:
      return formatInTimeZone(tickValue, tz, 'yyyy-MM-dd h:mm:ss a')
  }
}

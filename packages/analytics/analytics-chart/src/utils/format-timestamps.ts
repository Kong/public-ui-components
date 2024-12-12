import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import { formatInTimeZone } from 'date-fns-tz'

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

export const formatByGranularity = (
  tickValue: Date,
  granularity: GranularityValues,
  dayBoundaryCrossed: boolean,
  timezone: string = tz,
) => {
  if (['secondly', 'tenSecondly', 'thirtySecondly'].includes(granularity)) {
    return formatInTimeZone(tickValue, timezone, dayBoundaryCrossed ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a')
  }
  if (['minutely', 'fiveMinutely', 'tenMinutely', 'thirtyMinutely', 'hourly', 'twoHourly'].includes(granularity)) {
    return formatInTimeZone(tickValue, timezone, dayBoundaryCrossed ? 'yyyy-MM-dd h:mm a' : 'h:mm a')
  }
  if (granularity === 'twelveHourly') {
    return formatInTimeZone(tickValue, timezone, 'yyyy-MM-dd h:mm a')
  }

  if (granularity === 'daily') {
    return formatInTimeZone(tickValue, timezone, 'yyyy-MM-dd')
  }

  if (granularity === 'weekly') {
    return `${formatInTimeZone(tickValue, timezone, 'yyyy')}  W${formatInTimeZone(tickValue, timezone, 'II')}`
  }

  return formatInTimeZone(tickValue, timezone, 'yyyy-MM-dd h:mm:ss a')
}

import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import { formatInTimeZone } from 'date-fns-tz'

type TickResolver = (dayBoundaryCrossed: boolean) => string
type TooltipResolver = () => string

const weeklyFormatter = (tickValue: Date, tz: string) =>
  `${formatInTimeZone(tickValue, tz, 'yyyy')} W${formatInTimeZone(tickValue, tz, 'II')}`

const tickResolvers: Partial<Record<GranularityValues, TickResolver>> = {
  secondly: (d) => (d ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a'),
  tenSecondly: (d) => (d ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a'),
  thirtySecondly: (d) => (d ? 'yyyy-MM-dd h:mm:ss a' : 'h:mm:ss a'),
  minutely: (d) => (d ? 'yyyy-MM-dd h:mm a' : 'h:mm a'),
  fiveMinutely: (d) => (d ? 'yyyy-MM-dd h:mm a' : 'h:mm a'),
  tenMinutely: (d) => (d ? 'yyyy-MM-dd h:mm a' : 'h:mm a'),
  thirtyMinutely: (d) => (d ? 'yyyy-MM-dd h:mm a' : 'h:mm a'),
  hourly: (d) => (d ? 'yyyy-MM-dd h:mm a' : 'h:mm a'),
  twoHourly: (d) => (d ? 'yyyy-MM-dd h:mm a' : 'h:mm a'),
  twelveHourly: () => 'yyyy-MM-dd h:mm a',
  daily: () => 'yyyy-MM-dd',
}

const tooltipResolvers: Partial<Record<GranularityValues, TooltipResolver>> = {
  secondly: () => 'MMM dd, yyyy h:mm:ss a',
  tenSecondly: () => 'MMM dd, yyyy h:mm:ss a',
  thirtySecondly: () => 'MMM dd, yyyy h:mm:ss a',
  minutely: () => 'MMM dd, yyyy h:mm a',
  fiveMinutely: () => 'MMM dd, yyyy h:mm a',
  tenMinutely: () => 'MMM dd, yyyy h:mm a',
  thirtyMinutely: () => 'MMM dd, yyyy h:mm a',
  hourly: () => 'MMM dd, yyyy h:mm a',
  twoHourly: () => 'MMM dd, yyyy h:mm a',
  twelveHourly: () => 'MMM dd, yyyy h:mm a',
  daily: () => 'MMM dd, yyyy',
}

function formatUsingResolver({
  tickValue,
  granularity,
  timezone,
  dayBoundaryCrossed = false,
  tickMap,
  tooltipMap,
  defaultFormat,
}: {
  tickValue: Date
  granularity: GranularityValues
  timezone?: string
  dayBoundaryCrossed?: boolean
  tickMap?: Partial<Record<GranularityValues, TickResolver>>
  tooltipMap?: Partial<Record<GranularityValues, TooltipResolver>>
  defaultFormat: string
}): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  if (granularity === 'weekly') {
    return weeklyFormatter(tickValue, tz)
  }

  if (tickMap && tickMap[granularity]) {
    const fmt = tickMap[granularity]!(dayBoundaryCrossed)
    return formatInTimeZone(tickValue, tz, fmt)
  }

  if (tooltipMap && tooltipMap[granularity]) {
    const fmt = tooltipMap[granularity]!()
    return formatInTimeZone(tickValue, tz, fmt)
  }

  return formatInTimeZone(tickValue, tz, defaultFormat)
}

export const formatChartTicksByGranularity = ({
  tickValue,
  granularity,
  dayBoundaryCrossed,
  timezone,
}: {
  tickValue: Date
  granularity: GranularityValues
  dayBoundaryCrossed: boolean
  timezone?: string
}): string =>
  formatUsingResolver({
    tickValue,
    granularity,
    timezone,
    dayBoundaryCrossed,
    tickMap: tickResolvers,
    defaultFormat: 'yyyy-MM-dd h:mm:ss a',
  })

export const formatTooltipTimestampByGranularity = ({
  tickValue,
  granularity,
  timezone,
}: {
  tickValue: Date
  granularity: GranularityValues
  timezone?: string
}): string =>
  formatUsingResolver({
    tickValue,
    granularity,
    timezone,
    tooltipMap: tooltipResolvers,
    defaultFormat: 'MMM dd, yyyy h:mm:ss a',
  })



import type { GranularityValues } from '@kong-ui-public/analytics-utilities'
import { formatInTimeZone } from 'date-fns-tz'

type TickResolver = (dayBoundaryCrossed: boolean) => string
type TooltipResolver = () => string

const weeklyFormatter = (tickValue: Date, tz: string) =>
  `${formatInTimeZone(tickValue, tz, 'yyyy')} W${formatInTimeZone(tickValue, tz, 'II')}`

const TICK_FMT_DATE_TIME_SECONDS = 'yyyy-MM-dd h:mm:ss a'
const TICK_FMT_TIME_SECONDS = 'h:mm:ss a'
const TICK_FMT_DATE_TIME_MINUTES = 'yyyy-MM-dd h:mm a'
const TICK_FMT_TIME_MINUTES = 'h:mm a'
const TICK_FMT_DATE = 'yyyy-MM-dd'

const TOOLTIP_FMT_DATE_TIME_SECONDS = 'MMM dd, yyyy h:mm:ss a'
const TOOLTIP_FMT_DATE_TIME_MINUTES = 'MMM dd, yyyy h:mm a'

const tickResolvers: Partial<Record<GranularityValues, TickResolver>> = {
  secondly: (d) => (d ? TICK_FMT_DATE_TIME_SECONDS : TICK_FMT_TIME_SECONDS),
  tenSecondly: (d) => (d ? TICK_FMT_DATE_TIME_SECONDS : TICK_FMT_TIME_SECONDS),
  thirtySecondly: (d) => (d ? TICK_FMT_DATE_TIME_SECONDS : TICK_FMT_TIME_SECONDS),
  minutely: (d) => (d ? TICK_FMT_DATE_TIME_MINUTES : TICK_FMT_TIME_MINUTES),
  fiveMinutely: (d) => (d ? TICK_FMT_DATE_TIME_MINUTES : TICK_FMT_TIME_MINUTES),
  tenMinutely: (d) => (d ? TICK_FMT_DATE_TIME_MINUTES : TICK_FMT_TIME_MINUTES),
  thirtyMinutely: (d) => (d ? TICK_FMT_DATE_TIME_MINUTES : TICK_FMT_TIME_MINUTES),
  hourly: (d) => (d ? TICK_FMT_DATE_TIME_MINUTES : TICK_FMT_TIME_MINUTES),
  twoHourly: (d) => (d ? TICK_FMT_DATE_TIME_MINUTES : TICK_FMT_TIME_MINUTES),
  twelveHourly: () => TICK_FMT_DATE_TIME_MINUTES,
  daily: () => TICK_FMT_DATE,
}

const tooltipResolvers: Partial<Record<GranularityValues, TooltipResolver>> = {
  secondly: () => TOOLTIP_FMT_DATE_TIME_SECONDS,
  tenSecondly: () => TOOLTIP_FMT_DATE_TIME_SECONDS,
  thirtySecondly: () => TOOLTIP_FMT_DATE_TIME_SECONDS,
  minutely: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  fiveMinutely: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  tenMinutely: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  thirtyMinutely: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  hourly: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  twoHourly: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  twelveHourly: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
  daily: () => TOOLTIP_FMT_DATE_TIME_MINUTES,
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
    const fmt = tickMap[granularity](dayBoundaryCrossed)
    return formatInTimeZone(tickValue, tz, fmt)
  }

  if (tooltipMap && tooltipMap[granularity]) {
    const fmt = tooltipMap[granularity]()
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



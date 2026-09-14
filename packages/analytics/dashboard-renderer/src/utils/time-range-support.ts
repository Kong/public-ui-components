import type { TimeRangeV4 } from '@kong-ui-public/analytics-utilities'

import { TimePeriods, TIMEFRAME_LOOKUP } from '@kong-ui-public/analytics-utilities'

interface SupportedTimeRange {
  durationSeconds: number
  key: string
}

const getTimeRangeDurationMs = (timeRange: TimeRangeV4): number | undefined => {
  if (timeRange.type === 'relative') {
    return TimePeriods.get(TIMEFRAME_LOOKUP[timeRange.time_range])?.timeframeLengthMs()
  }

  return new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()
}

const getMaximumSupportedTimeRange = (supportedTimeRanges: string[]): SupportedTimeRange | undefined => {
  return supportedTimeRanges.reduce<SupportedTimeRange | undefined>((maximum, key) => {
    const durationSeconds = TimePeriods.get(TIMEFRAME_LOOKUP[key])?.maximumTimeframeLength()

    if (durationSeconds === undefined || maximum && durationSeconds <= maximum.durationSeconds) {
      return maximum
    }

    return { durationSeconds, key }
  }, undefined)
}

export const isTimeRangeUnsupported = (
  timeRange: TimeRangeV4 | undefined,
  supportedTimeRanges: string[] | undefined,
) => {
  if (!timeRange || !supportedTimeRanges?.length) {
    return undefined
  }

  const durationMs = getTimeRangeDurationMs(timeRange)
  const maximum = getMaximumSupportedTimeRange(supportedTimeRanges)

  return durationMs !== undefined && maximum && durationMs > maximum.durationSeconds * 1000 ? maximum : undefined
}

export const limitTimeRange = (
  timeRange: TimeRangeV4 | undefined,
  supportedTimeRanges: string[] | undefined,
): TimeRangeV4 | undefined => {
  const maximum = isTimeRangeUnsupported(timeRange, supportedTimeRanges)

  if (!maximum || !timeRange) {
    return timeRange
  }

  if (timeRange.type === 'relative') {
    return {
      ...timeRange,
      time_range: maximum.key,
    }
  }

  return {
    ...timeRange,
    start: new Date(new Date(timeRange.end).getTime() - maximum.durationSeconds * 1000),
  }
}

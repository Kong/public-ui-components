import { getTime, getUnixTime } from 'date-fns'

import {
  ceilToNearestTimeGrain,
  floorToNearestTimeGrain,
  Granularities,
  granularityMsToQuery,
} from './granularity'
import type { DruidGranularity, GranularityValues, QueryTime } from './types'

type TimeRange = { start: Date, end: Date }

abstract class BaseQueryTime implements QueryTime {
  protected readonly timeRange: TimeRange
  protected readonly tz?: string
  protected readonly granularity: GranularityValues

  constructor(timeRange: TimeRange, granularity: GranularityValues, tz?: string) {
    // This is an abstract class.
    if (this.constructor === BaseQueryTime) {
      throw new Error('BaseQueryTime is not meant to be used directly.')
    }

    this.timeRange = timeRange
    this.tz = tz
    this.granularity = granularity
  }

  abstract startDate(): Date

  abstract endDate(): Date

  abstract granularityMs(): number

  protected calculateStartDate( granularity: GranularityValues, periods = 1) {
    // Custom timeframes need special handling since it's hard to calculate the timeframe length.
    // For example, a custom timeframe that starts on 1/1 and ends on 1/1 has a length of 1 day, not 0.
    const ceilEnd = this.timeRange.end
    const floorStart = floorToNearestTimeGrain(this.timeRange.start, granularity, this.tz)
    const timeframeLengthMs = ceilEnd.getTime() - floorStart.getTime()
    const periodOffset = timeframeLengthMs * periods

    return new Date(floorStart.getTime() - periodOffset)
  }

  granularitySeconds(): number {
    return Math.floor(this.granularityMs() / 1000)
  }

  granularityDruid(): DruidGranularity {
    return granularityMsToQuery(this.granularityMs(), this.startDate().toISOString())
  }

  // Return a UNIX timestamp suitable for use in the `start` query param.
  startSeconds(): number {
    return getUnixTime(this.startDate())
  }

  // Return a UNIX timestamp suitable for use in the `end` query param.
  endSeconds(): number {
    return getUnixTime(this.endDate())
  }

  // Return epoch time in milliseconds, suitable for use in the `startMs` query param.
  startMs(): number {
    return getTime(this.startDate())
  }

  // Return epoch time in milliseconds, suitable for use in the `endMs` query param.
  endMs(): number {
    return getTime(this.endDate())
  }
}

// We expect to get back a number of values, depending on the selected timeframe and granularity.
export class TimeseriesQueryTime extends BaseQueryTime {

  constructor(timeRange: TimeRange, granularity: GranularityValues, tz?: string) {
    super(timeRange, granularity, tz)
  }

  startDate(): Date {
    return this.calculateStartDate(this.granularity)
  }

  endDate(): Date {
    return ceilToNearestTimeGrain(this.timeRange.end, this.granularity, this.tz)
  }

  granularityMs(): number {
    return Granularities[this.granularity]
  }
}

// We expect to get back 1 value, such that we can just show a big number without any trend information.
export class UnaryQueryTime extends BaseQueryTime {
  startDate(): Date {
    return this.calculateStartDate(this.granularity)
  }

  endDate(): Date {
    return ceilToNearestTimeGrain(this.timeRange.start, this.granularity, this.tz)
  }

  granularityMs(): number {
    return this.endDate().getTime() - this.startDate().getTime()
  }
}

// We expect to get back 2 values, such that we can make a comparison between them.
// Note that depending on the user's tier, they might not have permission to request double their current
// timeframe to calculate a trend.
export class DeltaQueryTime extends UnaryQueryTime {
  startDate(): Date {
    return this.calculateStartDate(this.granularity, 2)
  }

  granularityMs(): number {
    // Note the `super` call -- the granularity for a DeltaQueryTime is the same as for an
    // equivalent UnaryQueryTime, despite the fact that the start time for a Delta query is earlier.
    // This property must hold in order for the current period's numbers to not change between unary
    // and delta query times.
    return this.endDate().getTime() - super.startDate().getTime()
  }
}

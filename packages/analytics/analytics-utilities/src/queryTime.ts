import { getTime, getUnixTime, sub } from 'date-fns'

import {
  ceilToNearestTimeGrain,
  floorToNearestTimeGrain,
  Granularities,
  granularityMsToQuery,
} from './granularity'
import { DruidGranularity, GranularityKeys, QueryTime } from './types'
import { Timeframe } from './timeframes'

abstract class BaseQueryTime implements QueryTime {
  protected readonly timeframe: Timeframe
  protected readonly tz?: string

  constructor(timeframe: Timeframe, tz?: string) {
    // This is an abstract class.
    if (this.constructor === BaseQueryTime) {
      throw new Error('BaseQueryTime is not meant to be used directly.')
    }

    this.timeframe = timeframe
    this.tz = tz
  }

  abstract startDate(): Date

  abstract endDate(): Date

  abstract granularityMs(): number

  protected calculateStartDate(isRelative: boolean, granularity: GranularityKeys, periods = 1) {
    // `periods` is greater than 1 if we're doing a delta time query.
    if (isRelative) {
      return new Date(this.endDate().getTime() - this.timeframe.timeframeLengthMs() * periods)
    } else {
      // Custom timeframes need special handling since it's hard to calculate the timeframe length.
      // For example, a custom timeframe that starts on 1/1 and ends on 1/1 has a length of 1 day, not 0.
      const ceilEnd = this.endDate()
      const rawStart = this.timeframe.rawStart(this.tz)
      const floorStart = floorToNearestTimeGrain(rawStart, granularity, this.tz)
      const timeframeLengthMs = ceilEnd.getTime() - floorStart.getTime()
      const periodOffset = timeframeLengthMs * (periods - 1)

      return floorToNearestTimeGrain(
        new Date(rawStart.getTime() - periodOffset),
        granularity,
        this.tz,
      )
    }
  }

  granularitySeconds(): number {
    return Math.floor(this.granularityMs() / 1000)
  }

  granularityDruid(): DruidGranularity | null {
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

  // Return whether the timeframe's bounds are within the allotment for a free tier user.
  withinFreeTier(): boolean {
    return this.startDate() >= sub(new Date(), { days: 1 })
  }
}

// We expect to get back a number of values, depending on the selected timeframe and granularity.
export class TimeseriesQueryTime extends BaseQueryTime {
  private readonly granularity: GranularityKeys

  constructor(timeframe: Timeframe, granularity?: GranularityKeys, tz?: string) {
    super(timeframe, tz)

    if (granularity && timeframe.allowedGranularities().has(granularity)) {
      this.granularity = granularity
    } else {
      this.granularity = timeframe.defaultResponseGranularity
    }
  }

  startDate(): Date {
    return this.calculateStartDate(this.timeframe.isRelative, this.granularity)
  }

  endDate(): Date {
    return ceilToNearestTimeGrain(this.timeframe.rawEnd(), this.granularity, this.tz)
  }

  granularityMs(): number {
    return Granularities[this.granularity]
  }
}

// We expect to get back 1 value, such that we can just show a big number without any trend information.
export class UnaryQueryTime extends BaseQueryTime {
  startDate(): Date {
    return this.calculateStartDate(this.timeframe.isRelative, this.timeframe.dataGranularity)
  }

  endDate(): Date {
    return ceilToNearestTimeGrain(this.timeframe.rawEnd(this.tz), this.timeframe.dataGranularity, this.tz)
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
    return this.calculateStartDate(this.timeframe.isRelative, this.timeframe.dataGranularity, 2)
  }

  granularityMs(): number {
    // Note the `super` call -- the granularity for a DeltaQueryTime is the same as for an
    // equivalent UnaryQueryTime, despite the fact that the start time for a Delta query is earlier.
    return this.endDate().getTime() - super.startDate().getTime()
  }
}

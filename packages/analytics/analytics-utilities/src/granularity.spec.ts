import { Granularities, msToGranularity } from './granularity'
import { GranularityKeys } from './types'

const MS_IN_MINUTE = 60 * 1000
const MS_IN_HOUR = 60 * 60 * 1000
const MS_IN_DAY = 60 * 60 * 24 * 1000
const MS_IN_WEEK = 60 * 60 * 24 * 7 * 1000

describe('secondsToGranularity', () => {
  it('handles nullish values', () => {
    expect(msToGranularity(undefined)).toBe(null)
    expect(msToGranularity(0)).toBe(null)
  })

  it('parses seconds', () => {
    expect(msToGranularity(60000)).toBe('Minutely')
    expect(msToGranularity(3600000)).toBe('Hourly')
    expect(msToGranularity(86400000)).toBe('Daily')
    expect(msToGranularity(86500000)).toBe('Weekly')
  })
})

describe('granularityUnits', () => {
  it('Granularity is in milliseconds', () => {
    expect(Granularities[GranularityKeys.MINUTELY]).toBe(MS_IN_MINUTE)
    expect(Granularities[GranularityKeys.HOURLY]).toBe(MS_IN_HOUR)
    expect(Granularities[GranularityKeys.DAILY]).toBe(MS_IN_DAY)
    expect(Granularities[GranularityKeys.WEEKLY]).toBe(MS_IN_WEEK)
  })
})

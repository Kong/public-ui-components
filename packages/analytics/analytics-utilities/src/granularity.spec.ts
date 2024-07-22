import { Granularities, msToGranularity } from './granularity'

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
    expect(msToGranularity(60000)).toBe('minutely')
    expect(msToGranularity(3600000)).toBe('hourly')
    expect(msToGranularity(86400000)).toBe('daily')
    expect(msToGranularity(86500000)).toBe('weekly')
  })
})

describe('granularityUnits', () => {
  it('Granularity is in milliseconds', () => {
    expect(Granularities.minutely).toBe(MS_IN_MINUTE)
    expect(Granularities.hourly).toBe(MS_IN_HOUR)
    expect(Granularities.daily).toBe(MS_IN_DAY)
    expect(Granularities.weekly).toBe(MS_IN_WEEK)
  })
})

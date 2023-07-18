import { describe, it, expect } from 'vitest'
import useDate from './index'

describe('formatUnixToDate()', () => {
  const helpers = useDate()

  it('should return a properly formatted date in the YYYY-MM-DD HH:mm:ss ZZ format', () => {
    const formattedDateAM = helpers.formatUnixToDate(1558006979)
    const formattedDatePM = helpers.formatUnixToDate(1558057179)
    const january = helpers.formatUnixToDate(1547506800)
    const october = helpers.formatUnixToDate(1570111995)
    const november = helpers.formatUnixToDate(1573772400)
    const decimalTimestamp = helpers.formatUnixToDate(1570111995.652561)
    const integerTimestamp = helpers.formatUnixToDate(1570111995)

    expect(new Date(formattedDateAM).toUTCString()).toBe(new Date('2019-05-16 04:42:59 -0700').toUTCString())
    expect(new Date(formattedDatePM).toUTCString()).toBe(new Date('2019-05-16 18:39:39 -0700').toUTCString())
    expect(january.substring(0, 7)).toBe('2019-01')
    expect(october.substring(0, 7)).toBe('2019-10')
    expect(november.substring(0, 7)).toBe('2019-11')
    expect(decimalTimestamp).toEqual(integerTimestamp)
  })

  it('should handle undefined', () => {
    // @ts-ignore
    expect(helpers.formatUnixToDate(undefined)).toEqual('')
  })

  it('should handle null', () => {
    // @ts-ignore
    expect(helpers.formatUnixToDate(null)).toEqual('')
  })

  it('should handle bogus number', () => {
    // eslint-disable-next-line no-loss-of-precision
    expect(helpers.formatUnixToDate(894750982347502987435908275)).toEqual('')
  })
})

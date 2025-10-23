import { describe, it, expect } from 'vitest'
import { unitFormatter } from './formatUnit'
import { createI18n } from '@kong-ui-public/i18n'

const i18n = createI18n('en-us', {} as any)

const { formatBytes, formatCost, formatUnit, formatRange } = unitFormatter({ i18n })

describe('formatUnit.formatBytes()', () => {
  it.each([
    [1, '1 B'],
    [1000, '1 kB'],
    [1000000, '1 MB'],
    [1000000000, '1 GB'],
    [1000000000000, '1 TB'],
    [1000000000000000, '1 PB'],
  ])('converts %s bytes to \'%s\' when a kB is 1000 bytes', (value, expected) => {
    expect(formatBytes(value)).toEqual(expected)
    expect(formatUnit(value, 'bytes')).toEqual(expected)
  })

  it.each([
    [1, '1 B'],
    [1024, '1 kB'],
    [1048576, '1 MB'],
    [1073741824, '1 GB'],
    [1099511627776, '1 TB'],
    [1125899906842624, '1 PB'],
  ])('converts %s bytes to \'%s\' when a kB is 1024 bytes', (value, expected) => {
    expect(formatBytes(value, true)).toEqual(expected)
    expect(formatUnit(value, 'bytes', { isBytes1024: true })).toEqual(expected)
  })

  it.each([
    [0.001, '0.001 B'],
    [0.00111, '0.001 B'],
    [0.0016, '0.002 B'],
    [1.11, '1.11 B'],
    [1111, '1.11 kB'],
    [1116, '1.12 kB'],
    [1111111, '1.11 MB'],
    [1111111111, '1.11 GB'],
    [1111111111111, '1.11 TB'],
    [1111111111111111, '1.11 PB'],
  ])('converts %s bytes to \'%s\' with precision of 3', (value, expected) => {
    expect(formatBytes(value)).toEqual(expected)
    expect(formatUnit(value, 'bytes')).toEqual(expected)
  })
})

describe('formatUnit.formatCost', () => {
  it.each([
    [0.001, '$0.001'],
    [0.0011, '$0.0011'],
    [0.00111, '$0.00111'],
    [0.001111, '$0.001111'],
    [0.0011115, '$0.001112'],
    [0.00009, '< $0.0001'],
    [0.15555, '$0.16'],
    [1, '$1.00'],
    [1.001, '$1.00'],
    [1.005, '$1.01'],
    [100, '$100.00'],
    [10000, '$10,000.00'],
  ])('When cost is %s format as \'%s\'', (value, expected) => {
    expect(formatCost(value)).toEqual(expected)
    expect(formatUnit(value, 'usd')).toEqual(expected)
  })
})

describe('formatUnit.formatUnit()', () => {
  const testUnit = 'test-unit'

  it.each([
    [0.001, `0.001 ${testUnit}`],
    [0.0011, `0.0011 ${testUnit}`],
    [0.00111, `0.00111 ${testUnit}`],
    [0.001111, `0.001111 ${testUnit}`],
    [0.0011115, `0.001112 ${testUnit}`],
    [0.01, `0.01 ${testUnit}`],
    [0.015, `0.01 ${testUnit}`],
    [0.016, `0.02 ${testUnit}`],
    [0.15555, `0.16 ${testUnit}`],
    [0.0000001, `1e-7 ${testUnit}`], // look, if your data is this small that's what you get.
    [1, `1 ${testUnit}`],
    [100, `100 ${testUnit}`],
    [10000, `10,000 ${testUnit}`],
    [11111.001, `11,111 ${testUnit}`],
    [11111.006, `11,111.01 ${testUnit}`],
    [11111.23, `11,111.23 ${testUnit}`],
  ])('default formatting of %s results in \'%s\'', (value, expected) => {
    expect(formatUnit(value, testUnit)).toEqual(expected)
  })

  it('translates the unit if a translation function is provided', () => {
    expect(formatUnit(100, testUnit, {
      translateUnit: (unit, value) => `translated-${value}-${unit}`,
    })).toEqual(`100 translated-100-${testUnit}`)
  })

  it('approximates large values when approximate option is provided', () => {
    expect(formatUnit(1234, testUnit, { approximate: true })).toEqual('1.2K ' + testUnit)
  })

  it('does not approximate when unit is bytes or usd', () => {
    expect(formatUnit(1234, 'bytes', { approximate: true })).toEqual('1.23 kB')
    expect(formatUnit(1234, 'usd', { approximate: true })).toEqual('$1,234.00')
  })

  it('handles formatting range of values', () => {
    expect(formatRange(1000, 5000, 'ms')).toBe('1,000 - 5,000 ms')
    expect(formatRange(1000, 5000, 'count', { approximate: true })).toBe('1K - 5K count')
    expect(formatRange(1000, 5000, 'count/minute', { approximate: true })).toBe('1K - 5K count/minute')
    expect(formatRange(1000, 5000, 'bytes')).toBe('1 kB - 5 kB')
    expect(formatRange(0.001, 0.005, 'usd')).toBe('$0.001 - $0.005')
  })
})

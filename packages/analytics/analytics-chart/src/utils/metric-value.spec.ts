import { describe, it, expect } from 'vitest'
import { toMetricValue } from './metric-value'

describe('toMetricValue', () => {
  it('returns finite numbers as-is', () => {
    expect(toMetricValue(0)).toBe(0)
    expect(toMetricValue(12.5)).toBe(12.5)
    expect(toMetricValue(-3)).toBe(-3)
  })

  it('parses fully numeric strings', () => {
    expect(toMetricValue('12.5')).toBe(12.5)
    expect(toMetricValue(' 42 ')).toBe(42)
    expect(toMetricValue('1e3')).toBe(1000)
  })

  it('rejects null, undefined and blank strings', () => {
    expect(toMetricValue(null)).toBeUndefined()
    expect(toMetricValue(undefined)).toBeUndefined()
    expect(toMetricValue('')).toBeUndefined()
    expect(toMetricValue('   ')).toBeUndefined()
  })

  it('rejects partially numeric and non-numeric strings', () => {
    expect(toMetricValue('12ms')).toBeUndefined()
    expect(toMetricValue('abc')).toBeUndefined()
  })

  it('rejects non-finite numbers', () => {
    expect(toMetricValue(NaN)).toBeUndefined()
    expect(toMetricValue(Infinity)).toBeUndefined()
    expect(toMetricValue('-Infinity')).toBeUndefined()
  })
})

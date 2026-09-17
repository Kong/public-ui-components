import { describe, it, expect } from 'vitest'
import { AnthropicIcon, MetaLlamaIcon, OpenAiIcon } from '@kong/icons'
import {
  getBarRatio,
  getColumnOptions,
  getColumnStats,
  getRelativeValue,
  getThresholdType,
  toNumber,
} from './topn-columns'
import { getColumnIcon } from './dimension-icons'

describe('getColumnOptions', () => {
  it('returns undefined without options', () => {
    expect(getColumnOptions(undefined, 'request_count')).toBeUndefined()
  })

  it('prefers an exact key match', () => {
    const options = { REQUEST_COUNT: { label: 'upper' }, request_count: { label: 'lower' } }

    expect(getColumnOptions(options, 'request_count')?.label).toBe('lower')
  })

  it('falls back to a case-insensitive match', () => {
    expect(getColumnOptions({ request_count: { label: 'Requests' } }, 'REQUEST_COUNT')?.label).toBe('Requests')
  })
})

describe('toNumber', () => {
  it.each([
    [12, 12],
    ['3.5', 3.5],
    [null, null],
    [undefined, null],
    ['', null],
    ['abc', null],
    [Infinity, null],
  ])('converts %s to %s', (input, expected) => {
    expect(toNumber(input)).toBe(expected)
  })
})

describe('getColumnStats', () => {
  it('sums and finds the max while skipping nulls', () => {
    expect(getColumnStats([43, null, 31, 20])).toEqual({ sum: 94, max: 43 })
  })

  it('returns zeros for an empty column', () => {
    expect(getColumnStats([])).toEqual({ sum: 0, max: 0 })
  })
})

describe('getRelativeValue', () => {
  it('returns the fraction of the column total', () => {
    expect(getRelativeValue(25, { sum: 100, max: 50 })).toBe(0.25)
  })

  it('returns null when the column total is not positive', () => {
    expect(getRelativeValue(0, { sum: 0, max: 0 })).toBeNull()
  })
})

describe('getBarRatio', () => {
  const stats = { sum: 200, max: 50 }

  it('scales against the column total for relative bars', () => {
    expect(getBarRatio(50, stats, 'relative')).toBe(0.25)
  })

  it('scales against the column max for max bars', () => {
    expect(getBarRatio(25, stats, 'max')).toBe(0.5)
    expect(getBarRatio(50, stats, 'max')).toBe(1)
  })

  it('clamps to the 0-1 range', () => {
    expect(getBarRatio(-5, stats, 'max')).toBe(0)
    expect(getBarRatio(500, stats, 'max')).toBe(1)
  })

  it('returns 0 when the denominator is not positive', () => {
    expect(getBarRatio(10, { sum: 0, max: 0 }, 'relative')).toBe(0)
  })
})

describe('getThresholdType', () => {
  const thresholds = [
    { type: 'warning' as const, value: 100 },
    { type: 'error' as const, value: 500 },
  ]

  it('returns undefined below every threshold or without thresholds', () => {
    expect(getThresholdType(99, thresholds)).toBeUndefined()
    expect(getThresholdType(1000, undefined)).toBeUndefined()
  })

  it('uses the highest crossed threshold', () => {
    expect(getThresholdType(100, thresholds)).toBe('warning')
    expect(getThresholdType(750, thresholds)).toBe('error')
  })

  it('does not depend on threshold order', () => {
    expect(getThresholdType(750, [...thresholds].reverse())).toBe('error')
  })

  it('prefers error when thresholds share a value', () => {
    expect(getThresholdType(10, [{ type: 'error', value: 10 }, { type: 'warning', value: 10 }])).toBe('error')
  })
})

describe('getColumnIcon', () => {
  it('resolves ai provider ids case-insensitively', () => {
    expect(getColumnIcon('ai_provider', 'openai')).toBe(OpenAiIcon)
    expect(getColumnIcon('ai_provider', 'Anthropic')).toBe(AnthropicIcon)
  })

  it('maps provider ids that differ from the brand name', () => {
    expect(getColumnIcon('ai_provider', 'llama2')).toBe(MetaLlamaIcon)
  })

  it('returns undefined for unknown ids or no icon set', () => {
    expect(getColumnIcon('ai_provider', 'some-new-provider')).toBeUndefined()
    expect(getColumnIcon(undefined, 'openai')).toBeUndefined()
  })
})

import type { TableDataGridHeader } from '../types'
import {
  formatPercentage,
  getBarRatio,
  getCellIcon,
  getColumnStats,
  getThresholdType,
  toFiniteNumber,
} from './tableDataGridPresentation'
import { AnthropicIcon, OpenAiIcon } from '@kong/icons'
import { describe, expect, it } from 'vitest'

type TestRow = {
  name: string
  value: number | null
}

describe('table-data-grid presentation helpers', () => {
  it.each([true, false, '25', '', {}, Symbol('value'), NaN, Infinity, -Infinity, null, undefined])(
    'does not coerce nonnumeric or non-finite input %s',
    value => expect(toFiniteNumber(value)).toBeNull(),
  )

  it('calculates complete-result sum and maximum statistics', () => {
    const header: TableDataGridHeader<TestRow> = {
      dataType: 'number',
      key: 'value',
      label: 'Value',
    }

    expect(getColumnStats([
      { name: 'one', value: 25 },
      { name: 'two', value: 75 },
      { name: 'missing', value: null },
    ], header)).toEqual({ sum: 100, max: 75 })
  })

  it('preserves TopN relative and absolute bar scales', () => {
    const stats = { sum: 100, max: 75 }

    expect(getBarRatio(25, stats, 'relative')).to.equal(0.25)
    expect(getBarRatio(75, stats, 'relative')).to.equal(0.75)
    expect(getBarRatio(25, stats, 'absolute')).to.equal(1 / 3)
    expect(getBarRatio(75, stats, 'absolute')).to.equal(1)
  })

  it('clamps bars and resolves the highest threshold with error precedence', () => {
    expect(getBarRatio(-5, { sum: 100, max: 75 }, 'relative')).to.equal(0)
    expect(getBarRatio(100, { sum: 0, max: 0 }, 'absolute')).to.equal(0)
    expect(getThresholdType(100, [
      { type: 'warning', value: 50 },
      { type: 'warning', value: 100 },
      { type: 'error', value: 100 },
    ])).to.equal('error')
  })

  it('matches the first custom or built-in icon without mutating regexp state', () => {
    const pattern = /openai/gi
    pattern.lastIndex = 2

    expect(getCellIcon({
      displayValue: 'OpenAI',
      icons: [{ icon: OpenAiIcon, pattern }],
      rawValue: 'openai',
    })).to.equal(OpenAiIcon)
    expect(pattern.lastIndex).to.equal(2)
    expect(getCellIcon({ displayValue: 'OPENAI', rawValue: 'openai' })).to.equal(OpenAiIcon)
    expect(getCellIcon({
      displayValue: 'OpenAI',
      icons: [
        { icon: AnthropicIcon, pattern: /open/i },
        { icon: OpenAiIcon, pattern: /openai/i },
      ],
      rawValue: 'openai',
    })).to.equal(AnthropicIcon)
  })

  it('formats percentages with two decimal places and the small-value placeholder', () => {
    expect(formatPercentage(50)).to.equal('50 %')
    expect(formatPercentage(0.001)).to.equal('< 0.01 %')
  })
})

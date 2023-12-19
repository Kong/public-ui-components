import { describe, it, expect } from 'vitest'
import useTranslatedUnits from './useTranslatedUnits'

describe('useTranslatedUnits', () => {

  it('pluralizes properly', () => {
    const { translateUnit } = useTranslatedUnits()

    expect(translateUnit('count', 0)).toBe('requests')
    expect(translateUnit('count', 1)).toBe('request')
    expect(translateUnit('count', 2)).toBe('requests')
  })
})

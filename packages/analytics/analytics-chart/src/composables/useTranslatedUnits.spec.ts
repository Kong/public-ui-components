import { describe, it, expect } from 'vitest'
import useTranslatedUnits from './useTranslatedUnits'

describe('useTranslatedUnits', () => {

  it('pluralizes properly', () => {
    const { translateUnit } = useTranslatedUnits()

    expect(translateUnit('count', 0)).toBe('requests')
    expect(translateUnit('count', 1)).toBe('request')
    expect(translateUnit('count', 2)).toBe('requests')
  })

  it('suppresses unit text for unitless metrics', () => {
    const { translateUnit } = useTranslatedUnits()

    expect(translateUnit('control_plane_count', 1)).toBe('')
    expect(translateUnit('service_count', 2)).toBe('')
    expect(translateUnit('node_count', 2)).toBe('')
  })
})

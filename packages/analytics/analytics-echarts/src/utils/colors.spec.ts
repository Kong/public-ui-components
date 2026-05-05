import { describe, it, expect } from 'vitest'
import {
  KUI_COLOR_BACKGROUND_DISABLED,
  KUI_STATUS_COLOR_100,
  KUI_STATUS_COLOR_200,
  KUI_STATUS_COLOR_200S,
  KUI_STATUS_COLOR_2NA,
  KUI_STATUS_COLOR_300S,
  KUI_STATUS_COLOR_400S,
  KUI_STATUS_COLOR_408,
  KUI_STATUS_COLOR_409,
  KUI_STATUS_COLOR_500S,
  KUI_STATUS_COLOR_5NA,
} from '@kong/design-tokens'
import { defaultStatusCodeColors, lookupDatavisColor, lookupStatusCodeColor } from './colors'

describe('lookupDatavisColor', () => {
  it('handles large numbers of entities', () => {
    expect(lookupDatavisColor(5)).toBe('#a86cd5')
  })
})

describe('lookupStatusCodeColor', () => {
  it('resolves official token colors for standard status codes', () => {
    expect(lookupStatusCodeColor('100')).toBe(KUI_STATUS_COLOR_100)
    expect(lookupStatusCodeColor('200')).toBe(KUI_STATUS_COLOR_200)
    expect(lookupStatusCodeColor('408')).toBe(KUI_STATUS_COLOR_408)
    expect(lookupStatusCodeColor('409')).toBe(KUI_STATUS_COLOR_409)
  })

  it('uses official token fallback colors for unknown in-range codes', () => {
    expect(lookupStatusCodeColor('210')).toBe(KUI_STATUS_COLOR_2NA)
    expect(lookupStatusCodeColor('512')).toBe(KUI_STATUS_COLOR_5NA)
  })

  it('gracefully handles invalid codes', () => {
    expect(lookupStatusCodeColor('600')).toBe(KUI_COLOR_BACKGROUND_DISABLED)
    expect(lookupStatusCodeColor('000')).toBe(KUI_COLOR_BACKGROUND_DISABLED)
  })
})

describe('defaultStatusCodeColors', () => {
  it('uses official token colors for grouped status codes', () => {
    expect(defaultStatusCodeColors['2XX']).toBe(KUI_STATUS_COLOR_200S)
    expect(defaultStatusCodeColors['3XX']).toBe(KUI_STATUS_COLOR_300S)
    expect(defaultStatusCodeColors['4XX']).toBe(KUI_STATUS_COLOR_400S)
    expect(defaultStatusCodeColors['5XX']).toBe(KUI_STATUS_COLOR_500S)
  })
})

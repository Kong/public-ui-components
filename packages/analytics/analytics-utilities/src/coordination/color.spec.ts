import { describe, it, expect } from 'vitest'

import {
  color,
  colorByState,
  colorByStatusCode,
  colorByStatusCodeGroup,
  colorByDiscriminator,
  lightPalette,
  darkPalette,
} from './color'
import {
  stateColors,
  statusCodeColors,
  statusCodeGroupColors,
  type ColorState,
  unknownStatusCodeColors,
} from './color-overrides'

describe('color utils - colorByDiscriminator()', () => {
  it('uses the lightPalette when theme is "light"', () => {
    // for ease of generating a bunch of results, just iterate through the length
    // of the palette. Any integer works as a discriminator.
    lightPalette.forEach((_, index) => {
      const result = colorByDiscriminator({ discriminator: index, theme: 'light' })
      expect(lightPalette.includes(result)).toBe(true)
    })
  })

  it('uses the darkPalette when theme is "dark"', () => {
    // for ease of generating a bunch of results, just iterate through the length
    // of the palette. Any integer works as a discriminator.
    darkPalette.forEach((_, index) => {
      const result = colorByDiscriminator({ discriminator: index, theme: 'dark' })
      expect(darkPalette.includes(result)).toBe(true)
    })
  })

  it('handles discriminators that are not whole integers', () => {
    expect(lightPalette.includes(colorByDiscriminator({ discriminator: 39.599, theme: 'light' }))).toBe(true)
    expect(lightPalette.includes(colorByDiscriminator({ discriminator: 0.0003, theme: 'light' }))).toBe(true)
  })

  it('handles discriminators that are negative', () => {
    expect(lightPalette.includes(colorByDiscriminator({ discriminator: -1.3, theme: 'light' }))).toBe(true)
    expect(lightPalette.includes(colorByDiscriminator({ discriminator: -100, theme: 'light' }))).toBe(true)
  })
})

describe('color utils - colorByState()', () => {
  it('uses the reserved chart series 9 color for empty dimensions', () => {
    expect(colorByState({ state: 'empty' })).toBe('#9DA99D')
    expect(color({ dimensionValue: 'empty' })).toBe('#9DA99D')
  })

  it('returns some default color when the state is invalid', () => {
    // @ts-ignore we're intentionally passing an invalid state
    const result = colorByState({ state: 'invalid state' })
    expect(result).toBeDefined()
  })

  it.each(Object.keys(stateColors))('returns a color for color state "%s"', (state) => {
    const result = colorByState({ state: state as ColorState })
    expect(result).toBeDefined()
  })
})

describe('color utils - colorByStatusCode()', () => {
  it.each(Object.keys(statusCodeColors))('It returns a color for "%s"', (statusCode) => {
    const neutral = colorByState({ state: 'neutral' })
    const result = colorByStatusCode({ statusCode })
    expect(result).toBeDefined()
    expect(result).not.toEqual(neutral)
  })

  it.each([
    ['100', '104'],
    ['200', '209'],
    ['300', '309'],
    ['400', '430'],
    ['500', '509'],
  ])('returns the default %s-ish color for %s which does not have a color defined', (group, statusCode) => {
    expect(statusCodeColors[statusCode]).toBeUndefined()

    const result = colorByStatusCode({ statusCode })
    expect(result).toBeDefined()
    expect(result).toEqual(unknownStatusCodeColors[group])
  })
})

describe('color utils - colorByStatusCodeGroup()', () => {
  it.each(Object.keys(statusCodeGroupColors))('It returns a color for "%s"', (group) => {
    const neutral = colorByState({ state: 'neutral' })
    const result = colorByStatusCodeGroup({ group })
    expect(result).toBeDefined()
    expect(result).not.toEqual(neutral)
  })
})

describe('color utils - color() override priority', () => {
  it('prefers state over a custom dimension color', () => {
    expect(color({ state: 'neutral', dimensionValue: 'foo', customDimensionColors: { foo: '#123456' } }))
      .toBe(colorByState({ state: 'neutral' }))
  })

  it('prefers state over a discriminator', () => {
    expect(color({ state: 'neutral', discriminator: 3 })).toBe(colorByState({ state: 'neutral' }))
  })

  it('prefers a custom dimension color over the empty/other overrides', () => {
    expect(color({ dimensionValue: 'empty', customDimensionColors: { empty: '#123456' } })).toBe('#123456')
    expect(color({ dimensionValue: '____OTHER____', customDimensionColors: { '____OTHER____': '#654321' } })).toBe('#654321')
  })

  it('prefers a custom dimension color over status code colors and the discriminator', () => {
    expect(color({ dimension: 'status_code', dimensionValue: '200', customDimensionColors: { 200: '#123456' } })).toBe('#123456')
    expect(color({ dimensionValue: 'foo', discriminator: 2, customDimensionColors: { foo: '#123456' } })).toBe('#123456')
  })

  it('prefers empty/other and status code overrides over the discriminator', () => {
    expect(color({ dimensionValue: 'empty', discriminator: 2 })).toBe(colorByState({ state: 'empty' }))
    expect(color({ dimension: 'status_code', dimensionValue: '200', discriminator: 2 })).toBe(colorByStatusCode({ statusCode: '200' }))
    expect(color({ dimension: 'status_code_grouped', dimensionValue: '2XX', discriminator: 2 })).toBe(colorByStatusCodeGroup({ group: '2XX' }))
  })

  it('uses the discriminator when no overrides apply', () => {
    expect(color({ dimension: 'service', dimensionValue: 'foo', discriminator: 2 }))
      .toBe(colorByDiscriminator({ discriminator: 2, theme: 'light' }))
  })
})

import { describe, it, expect, afterEach } from 'vitest'
import { KUI_COLOR_TEXT } from '@kong/design-tokens'
import { scatterChartColors, withAlpha } from './theme-colors'

describe('withAlpha', () => {
  it('expands and converts a 6-digit hex', () => {
    expect(withAlpha('#FFE5EA', 0.7)).toBe('rgba(255, 229, 234, 0.7)')
  })

  it('expands a 3-digit hex', () => {
    expect(withAlpha('#f00', 0.5)).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('tolerates surrounding whitespace, as getPropertyValue can return', () => {
    expect(withAlpha('  #361118  ', 0.7)).toBe('rgba(54, 17, 24, 0.7)')
  })

  it('applies the alpha to the other CSS color formats', () => {
    expect(withAlpha('rgba(1, 2, 3, 0.5)', 0.7)).toBe('rgba(1, 2, 3, 0.7)')
    expect(withAlpha('red', 0.7)).toBe('rgba(255, 0, 0, 0.7)')
    expect(withAlpha('#FFE5EA80', 0.7)).toBe('rgba(255, 229, 234, 0.7)')
  })

  it('returns unparseable values untouched rather than mangling them', () => {
    expect(withAlpha('#12345', 0.7)).toBe('#12345')
    expect(withAlpha('var(--kui-color-text)', 0.7)).toBe('var(--kui-color-text)')
    expect(withAlpha('', 0.7)).toBe('')
  })
})

describe('scatterChartColors', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--kui-color-text')
    document.documentElement.style.removeProperty('--kui-color-background-danger')
    document.documentElement.style.removeProperty('--kui-color-background-danger-weakest')
  })

  it('falls back to the compiled tokens when the properties are not set', () => {
    expect(scatterChartColors().medianLine).toBe(KUI_COLOR_TEXT)
  })

  it('reads the values the active theme resolved', () => {
    document.documentElement.style.setProperty('--kui-color-text', '#123456')
    document.documentElement.style.setProperty('--kui-color-background-danger', '#654321')

    const colors = scatterChartColors()

    expect(colors.medianLine).toBe('#123456')
    expect(colors.outlier).toBe('#654321')
  })

  it('makes the outlier band translucent so gridlines stay visible', () => {
    document.documentElement.style.setProperty('--kui-color-background-danger-weakest', '#FFE5EA')

    expect(scatterChartColors().outlierBand).toBe('rgba(255, 229, 234, 0.7)')
  })

  it('reads from a supplied element', () => {
    const el = document.createElement('div')
    el.style.setProperty('--kui-color-text', '#abcdef')
    document.body.appendChild(el)

    expect(scatterChartColors(el).medianLine).toBe('#abcdef')

    el.remove()
  })
})

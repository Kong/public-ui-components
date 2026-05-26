import { describe, expect, it, vi } from 'vitest'
import { KUI_COLOR_BACKGROUND, KUI_COLOR_BACKGROUND_INVERSE } from '@kong/design-tokens'
import { registerTheme } from 'echarts/core'
import type * as EchartsCore from 'echarts/core'
import {
  defaultEchartsThemePalette,
  konnectDarkTheme,
  konnectTheme,
  konnectThemePalette,
  registerAnalyticsEchartsThemes,
  registerAnalyticsEchartsTheme,
  resolveAnalyticsEchartsThemePalette,
} from './index'

vi.mock('echarts/core', async (importOriginal) => {
  const actual = await importOriginal<typeof EchartsCore>()

  return {
    ...actual,
    registerTheme: vi.fn(),
  }
})

describe('analytics-echarts themes', () => {
  it('uses the existing datavis palette for the default ECharts theme palette', () => {
    expect(defaultEchartsThemePalette).toEqual([
      '#a86cd5',
      '#6a86d2',
      '#00bbf9',
      '#00c4b0',
      '#ffdf15',
    ])
  })

  it('registers local themes only once', () => {
    registerAnalyticsEchartsThemes()
    registerAnalyticsEchartsThemes()

    expect(registerTheme).toHaveBeenCalledTimes(2)
    expect(registerTheme).toHaveBeenCalledWith('konnect', konnectTheme)
    expect(registerTheme).toHaveBeenCalledWith('konnect-dark', konnectDarkTheme)
  })

  it('backs the Konnect themes with design token values', () => {
    expect(konnectTheme.backgroundColor).toBe(KUI_COLOR_BACKGROUND)
    expect(konnectDarkTheme.backgroundColor).toBe(KUI_COLOR_BACKGROUND_INVERSE)
    expect(konnectTheme.color).toEqual(konnectThemePalette)
    expect(konnectTheme).not.toHaveProperty('tooltip')
    expect(konnectDarkTheme).not.toHaveProperty('tooltip')
  })

  it('resolves palettes from known local theme names', () => {
    expect(resolveAnalyticsEchartsThemePalette('konnect')).toEqual(konnectThemePalette)
  })

  it('resolves palettes from provided theme objects', () => {
    expect(resolveAnalyticsEchartsThemePalette({
      color: ['#123456', '#654321'],
    })).toEqual(['#123456', '#654321'])
  })

  it('resolves palettes from dynamically registered local themes', () => {
    registerAnalyticsEchartsTheme('test-theme', {
      color: ['#abcdef'],
    })

    expect(resolveAnalyticsEchartsThemePalette('test-theme')).toEqual(['#abcdef'])
  })

  it('falls back to the default light palette for unknown themes', () => {
    expect(resolveAnalyticsEchartsThemePalette('missing-theme')).toEqual(resolveAnalyticsEchartsThemePalette('light'))
  })
})

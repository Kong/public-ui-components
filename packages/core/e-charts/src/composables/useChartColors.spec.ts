import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { chartColors, useChartColors } from './useChartColors'
import { KUI_COLOR_BACKGROUND, KUI_COLOR_BACKGROUND_ACCENT, KUI_COLOR_TEXT } from '@kong/design-tokens'

const mockComputedStyle = (values: Record<string, string>) => {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (property: string) => values[property] ?? '',
  } as unknown as CSSStyleDeclaration)
}

describe('chartColors', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.removeAttribute('data-kui-theme')
  })

  it('falls back to static token values when CSS custom properties are unset', () => {
    mockComputedStyle({})

    expect(chartColors().KUI_COLOR_BACKGROUND).toBe(KUI_COLOR_BACKGROUND)
    expect(chartColors().KUI_COLOR_BACKGROUND_ACCENT).toBe(KUI_COLOR_BACKGROUND_ACCENT)
  })

  it('resolves CSS custom properties at runtime', () => {
    mockComputedStyle({ '--kui-color-background': '#ffffff', '--kui-color-background-accent': '#315efb' })
    const colors = chartColors()

    expect(colors.KUI_COLOR_BACKGROUND).toBe('#ffffff')
    expect(colors.KUI_COLOR_BACKGROUND_ACCENT).toBe('#315efb')
  })

  it('includes every color token exported by @kong/design-tokens', () => {
    mockComputedStyle({})

    const names = Object.keys(chartColors())

    expect(names.length).toBeGreaterThan(10)
    expect(names.every((name) => name.startsWith('KUI_COLOR'))).toBe(true)
  })

  it('resolves tokens beyond any fixed list, with static fallbacks', () => {
    mockComputedStyle({ '--kui-color-text': '#123456' })

    const colors = chartColors()

    expect(colors.KUI_COLOR_TEXT).toBe('#123456')

    mockComputedStyle({})
    expect(chartColors().KUI_COLOR_TEXT).toBe(KUI_COLOR_TEXT)
  })
})

describe('useChartColors', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.removeAttribute('data-kui-theme')
  })

  it('re-resolves colors when the provided trigger ref changes', async () => {
    const trigger = ref(0)
    const colors = useChartColors(trigger)

    expect(colors.value.KUI_COLOR_BACKGROUND_ACCENT).toBe(KUI_COLOR_BACKGROUND_ACCENT)

    mockComputedStyle({ '--kui-color-background-accent': '#123456' })
    trigger.value++
    await nextTick()

    expect(colors.value.KUI_COLOR_BACKGROUND_ACCENT).toBe('#123456')
  })

  it('re-resolves colors when the data-kui-theme attribute changes', async () => {
    const colors = useChartColors()

    expect(colors.value.KUI_COLOR_BACKGROUND_ACCENT).toBe(KUI_COLOR_BACKGROUND_ACCENT)

    mockComputedStyle({ '--kui-color-background-accent': '#abcdef' })
    document.documentElement.setAttribute('data-kui-theme', 'classic-night')
    await nextTick()

    expect(colors.value.KUI_COLOR_BACKGROUND_ACCENT).toBe('#abcdef')
  })

  it('still re-resolves colors on data-kui-theme changes when a trigger ref is also provided', async () => {
    const trigger = ref(0)
    const colors = useChartColors(trigger)

    expect(colors.value.KUI_COLOR_BACKGROUND_ACCENT).toBe(KUI_COLOR_BACKGROUND_ACCENT)

    mockComputedStyle({ '--kui-color-background-accent': '#abcdef' })
    document.documentElement.setAttribute('data-kui-theme', 'classic-night')
    await nextTick()

    expect(colors.value.KUI_COLOR_BACKGROUND_ACCENT).toBe('#abcdef')
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { chartColors, useChartColors } from './useChartColors'
import { KUI_COLOR_BACKGROUND, KUI_COLOR_BACKGROUND_ACCENT } from '@kong/design-tokens'

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
})

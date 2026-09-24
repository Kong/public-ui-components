import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { chartTheme, useChartTheme } from './useChartTheme'
import { chartColors } from './useChartColors'
import { KUI_COLOR_BACKGROUND, KUI_COLOR_BORDER, KUI_COLOR_TEXT, KUI_COLOR_TEXT_NEUTRAL, KUI_FONT_FAMILY_TEXT } from '@kong/design-tokens'

const mockComputedStyle = (values: Record<string, string>) => {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (property: string) => values[property] ?? '',
  } as unknown as CSSStyleDeclaration)
}

describe('chartTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds text, axis, tooltip, visualMap and legend colors from resolved chart colors', () => {
    mockComputedStyle({})
    const theme = chartTheme(chartColors())

    expect(theme.textStyle).toMatchObject({ color: KUI_COLOR_TEXT })
    expect(theme.categoryAxis).toMatchObject({
      axisLabel: { color: KUI_COLOR_TEXT_NEUTRAL },
      axisLine: { lineStyle: { color: KUI_COLOR_BORDER } },
      splitLine: { lineStyle: { color: KUI_COLOR_BORDER } },
    })
    expect(theme.valueAxis).toEqual(theme.categoryAxis)
    expect(theme.tooltip).toMatchObject({
      backgroundColor: KUI_COLOR_BACKGROUND,
      borderColor: KUI_COLOR_BORDER,
      textStyle: { color: KUI_COLOR_TEXT },
    })
    expect(theme.visualMap).toMatchObject({ textStyle: { color: KUI_COLOR_TEXT_NEUTRAL } })
    expect(theme.legend).toMatchObject({ textStyle: { color: KUI_COLOR_TEXT_NEUTRAL } })
  })

  it('resolves the font family from --kui-font-family-text at runtime', () => {
    mockComputedStyle({ '--kui-font-family-text': 'CustomFont, sans-serif' })
    const theme = chartTheme(chartColors())

    expect((theme.textStyle as { fontFamily: string }).fontFamily).toBe('CustomFont, sans-serif')
  })

  it('falls back to the static font family token', () => {
    mockComputedStyle({})
    const theme = chartTheme(chartColors())

    expect((theme.textStyle as { fontFamily: string }).fontFamily).toBe(KUI_FONT_FAMILY_TEXT)
  })
})

describe('useChartTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rebuilds the theme when the colors ref changes', async () => {
    mockComputedStyle({})
    const colors = ref(chartColors())
    const theme = useChartTheme(colors)

    expect((theme.value.textStyle as { color: string }).color).toBe(KUI_COLOR_TEXT)

    mockComputedStyle({ '--kui-color-text': '#123456' })
    colors.value = chartColors()
    await nextTick()

    expect((theme.value.textStyle as { color: string }).color).toBe('#123456')
  })
})

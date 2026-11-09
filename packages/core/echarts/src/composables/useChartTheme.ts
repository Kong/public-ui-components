/**
 * Why this file exists?
 *
 * Every chart should share the same look and feel (text, axis, tooltip and
 * legend colors) without each chart wrapper wiring up its own theme option.
 * This builds the ECharts theme object (see `VChart`'s `theme` prop) once
 * from the resolved design-token colors, so it stays in sync with the active
 * theme the same way `useChartColors` does.
 */

import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { KUI_BORDER_RADIUS_30, KUI_BORDER_WIDTH_10, KUI_COLOR_BORDER, KUI_FONT_FAMILY_TEXT, KUI_SHADOW } from '@kong/design-tokens'
import type { ChartColors } from '../types'

/** An ECharts theme option object (see `echarts.registerTheme`/`setTheme`). */
export type ChartTheme = Record<string, unknown>

/** Resolves `--kui-font-family-text` from the active theme, falling back to the static token. */
export const chartFontFamily = (): string => {
  if (typeof window === 'undefined') {
    return KUI_FONT_FAMILY_TEXT
  }

  return window.getComputedStyle(document.documentElement).getPropertyValue('--kui-font-family-text').trim() || KUI_FONT_FAMILY_TEXT
}

// Same surface as a Kongponents popover. ECharts writes this onto the tooltip element, so the theme's custom properties apply.
const TOOLTIP_CSS = [
  `border: var(--kui-pop-border-width, var(--kui-border-width-10, ${KUI_BORDER_WIDTH_10})) solid var(--kui-pop-color-border, var(--kui-color-border, ${KUI_COLOR_BORDER}));`,
  `border-radius: var(--kui-pop-border-radius, var(--kui-border-radius-30, ${KUI_BORDER_RADIUS_30}));`,
  `box-shadow: var(--kui-pop-shadow, var(--kui-shadow, ${KUI_SHADOW}));`,
].join(' ')

/** Builds the ECharts theme object from already-resolved chart colors. */
export const chartTheme = (colors: ChartColors): ChartTheme => {
  const fontFamily = chartFontFamily()
  const textStyle = { color: colors.KUI_COLOR_TEXT, fontFamily }
  const axisCommon = {
    axisLabel: { color: colors.KUI_COLOR_TEXT_NEUTRAL, fontFamily },
    axisLine: { lineStyle: { color: colors.KUI_COLOR_BORDER } },
    splitLine: { lineStyle: { color: colors.KUI_COLOR_BORDER } },
  }

  return {
    textStyle,
    categoryAxis: axisCommon,
    valueAxis: axisCommon,
    // Same box as the analytics-chart tooltip. No padding: `ChartTooltip` has its own spacing
    tooltip: {
      backgroundColor: colors.KUI_COLOR_BACKGROUND,
      // Border and radius come from TOOLTIP_CSS so they follow the theme.
      borderWidth: 0,
      padding: 0,
      // Keep the tooltip inside the chart so tiles with `overflow: hidden` don't clip it
      confine: true,
      extraCssText: TOOLTIP_CSS,
      textStyle: { color: colors.KUI_COLOR_TEXT, fontFamily },
    },
    visualMap: {
      textStyle: { color: colors.KUI_COLOR_TEXT_NEUTRAL, fontFamily },
    },
    legend: {
      textStyle: { color: colors.KUI_COLOR_TEXT_NEUTRAL, fontFamily },
    },
  }
}

/** Reactive chart theme, rebuilt whenever the given resolved colors change. */
export const useChartTheme = (colors: Ref<ChartColors>): ComputedRef<ChartTheme> => (
  computed(() => chartTheme(colors.value))
)

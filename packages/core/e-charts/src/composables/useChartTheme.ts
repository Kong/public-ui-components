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
import { KUI_FONT_FAMILY_TEXT } from '@kong/design-tokens'
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
    tooltip: {
      backgroundColor: colors.KUI_COLOR_BACKGROUND,
      borderColor: colors.KUI_COLOR_BORDER,
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

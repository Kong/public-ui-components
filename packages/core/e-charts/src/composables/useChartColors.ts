/**
 * Why this file exists?
 *
 * ECharts renders to a canvas, so chart colors can't consume `--kui-color-*`
 * custom properties via `var()` the way DOM components do.
 * This composable resolves the token values from the document instead, and re-resolves them
 * whenever the theme changes so charts stay in sync.
 */

import { getCurrentScope, onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { ChartColors } from '../types'
import {
  KUI_COLOR_BACKGROUND,
  KUI_COLOR_BACKGROUND_ACCENT,
  KUI_COLOR_BACKGROUND_DANGER,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE,
  KUI_COLOR_BACKGROUND_INFO_STRONG,
  KUI_COLOR_BACKGROUND_INFO_WEAKEST,
  KUI_COLOR_BACKGROUND_OVERLAY,
  KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  KUI_COLOR_BACKGROUND_WARNING,
  KUI_COLOR_BACKGROUND_WARNING_WEAK,
  KUI_COLOR_TEXT_DISABLED,
} from '@kong/design-tokens'


/**
 * Resolve chart colors from `@kong/design-tokens` CSS custom properties at
 * runtime so charts pick up the active theme, falling back to the static
 * token values from the package. https://github.com/Kong/design-tokens
 */
export const chartColors = (): ChartColors => {
  if (typeof window === 'undefined') {
    return {
      KUI_COLOR_BACKGROUND,
      KUI_COLOR_BACKGROUND_ACCENT,
      KUI_COLOR_BACKGROUND_DANGER,
      KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE,
      KUI_COLOR_BACKGROUND_INFO_STRONG,
      KUI_COLOR_BACKGROUND_INFO_WEAKEST,
      KUI_COLOR_BACKGROUND_OVERLAY,
      KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
      KUI_COLOR_BACKGROUND_WARNING,
      KUI_COLOR_BACKGROUND_WARNING_WEAK,
      KUI_COLOR_TEXT_DISABLED,
    }
  }

  const styles = window.getComputedStyle(document.documentElement)

  const getColor = (customProperty: string, fallback: string): string => (
    styles.getPropertyValue(customProperty).trim() || fallback
  )

  return {
    KUI_COLOR_BACKGROUND: getColor('--kui-color-background', KUI_COLOR_BACKGROUND),
    KUI_COLOR_BACKGROUND_ACCENT: getColor('--kui-color-background-accent', KUI_COLOR_BACKGROUND_ACCENT),
    KUI_COLOR_BACKGROUND_DANGER: getColor('--kui-color-background-danger', KUI_COLOR_BACKGROUND_DANGER),
    KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE: getColor('--kui-color-background-decorative-purple', KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE),
    KUI_COLOR_BACKGROUND_INFO_STRONG: getColor('--kui-color-background-info-strong', KUI_COLOR_BACKGROUND_INFO_STRONG),
    KUI_COLOR_BACKGROUND_INFO_WEAKEST: getColor('--kui-color-background-info-weakest', KUI_COLOR_BACKGROUND_INFO_WEAKEST),
    KUI_COLOR_BACKGROUND_OVERLAY: getColor('--kui-color-background-overlay', KUI_COLOR_BACKGROUND_OVERLAY),
    KUI_COLOR_BACKGROUND_SUCCESS_WEAK: getColor('--kui-color-background-success-weak', KUI_COLOR_BACKGROUND_SUCCESS_WEAK),
    KUI_COLOR_BACKGROUND_WARNING: getColor('--kui-color-background-warning', KUI_COLOR_BACKGROUND_WARNING),
    KUI_COLOR_BACKGROUND_WARNING_WEAK: getColor('--kui-color-background-warning-weak', KUI_COLOR_BACKGROUND_WARNING_WEAK),
    KUI_COLOR_TEXT_DISABLED: getColor('--kui-color-text-disabled', KUI_COLOR_TEXT_DISABLED),
  }
}

/**
 * Reactive `chartColors`: re-resolves when `trigger` changes, or when the
 * theme (the `data-kui-theme` attribute on `<html>`) changes.
 */
export const useChartColors = (trigger?: Ref<unknown>): Ref<ChartColors> => {
  const colors = ref<ChartColors>(chartColors())

  if (trigger) {
    watch(trigger, () => {
      colors.value = chartColors()
    })
  } else if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      colors.value = chartColors()
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-kui-theme'] })

    if (getCurrentScope()) {
      onScopeDispose(() => observer.disconnect())
    }
  }

  return colors
}

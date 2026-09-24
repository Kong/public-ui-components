/**
 * Why this file exists?
 *
 * ECharts renders to a canvas, so chart colors can't consume `--kui-color-*`
 * custom properties via `var()` the way DOM components do.
 * This composable resolves the token values from the document instead, and re-resolves them
 * whenever the theme changes so charts stay in sync.
 *
 * Every color token exported by `@kong/design-tokens` is resolved generically,
 * so new tokens are picked up without any changes here.
 */

import { getCurrentScope, onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'
import * as designTokens from '@kong/design-tokens'
import type { ChartColors } from '../types'

const colorTokenNames = Object.keys(designTokens).filter((name) => name.startsWith('KUI_COLOR'))

const tokenFallback = (name: string): string => designTokens[name as keyof typeof designTokens] as string

/** `KUI_COLOR_TEXT_DISABLED` → `--kui-color-text-disabled` */
const toCssProperty = (tokenName: string): string => `--${tokenName.toLowerCase().replaceAll('_', '-')}`

/**
 * Resolve every color token from `@kong/design-tokens` CSS custom properties at
 * runtime so charts pick up the active theme, falling back to the static
 * token values from the package. https://github.com/Kong/design-tokens
 */
export const chartColors = (): ChartColors => {
  if (typeof window === 'undefined') {
    return Object.fromEntries(colorTokenNames.map((name) => [name, tokenFallback(name)])) as ChartColors
  }

  const styles = window.getComputedStyle(document.documentElement)

  const getColor = (customProperty: string, fallback: string): string => (
    styles.getPropertyValue(customProperty).trim() || fallback
  )

  return Object.fromEntries(
    colorTokenNames.map((name) => [name, getColor(toCssProperty(name), tokenFallback(name))]),
  ) as ChartColors
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

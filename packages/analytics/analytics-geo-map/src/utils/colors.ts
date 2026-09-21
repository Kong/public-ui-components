import { KUI_COLOR_BACKGROUND, KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER } from '@kong/design-tokens'

export interface GeoMapColors {
  emptyCountryFill: string
  waterFill: string
}

/**
 * Determine the map colors from the `element` and falls back to `<html>`.
 */
export const geoMapColors = (element?: Element | null): GeoMapColors => {
  const target = element ?? (typeof document === 'undefined' ? null : document.documentElement)

  if (typeof window === 'undefined' || !target) {
    return {
      emptyCountryFill: KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER,
      waterFill: KUI_COLOR_BACKGROUND,
    }
  }

  const styles = window.getComputedStyle(target)

  const getColor = (customProperty: string, fallback: string): string => (
    styles.getPropertyValue(customProperty).trim() || fallback
  )

  return {
    emptyCountryFill: getColor('--kui-color-background-neutral-weaker', KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER),
    waterFill: getColor('--kui-color-background', KUI_COLOR_BACKGROUND),
  }
}

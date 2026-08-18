import { KUI_COLOR_BACKGROUND, KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER } from '@kong/design-tokens'

export interface GeoMapColors {
  emptyCountryFill: string
  waterFill: string
}

/**
 * Determine the map colors based on the theme applied to the `<html>` element.
 */
export const geoMapColors = (): GeoMapColors => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      emptyCountryFill: KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER,
      waterFill: KUI_COLOR_BACKGROUND,
    }
  }

  const styles = window.getComputedStyle(document.documentElement)

  const getColor = (customProperty: string, fallback: string): string => (
    styles.getPropertyValue(customProperty).trim() || fallback
  )

  return {
    emptyCountryFill: getColor('--kui-color-background-neutral-weaker', KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER),
    waterFill: getColor('--kui-color-background', KUI_COLOR_BACKGROUND),
  }
}

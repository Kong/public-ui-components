import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

/**
 * Color scheme for an `OnboardingCardItem`'s icon box, akin to `KBadge`'s `appearance` prop.
 */
export type OnboardingCardItemAppearance = 'success' | 'decorative-purple' | 'decorative-aqua' | 'neutral'

export interface OnboardingCardItem {
  /** Icon component from `@kong/icons`. Optional - omit to render without an icon. */
  icon?: Component
  /** Icon box color scheme. Defaults to `success`. */
  appearance?: OnboardingCardItemAppearance
  title: string
  description?: string
  /**
   * Icon component from `@kong/icons` rendered at the trailing edge of the item, e.g. an
   * external-link indicator for items with an `href`. Optional - omit to render without one.
   */
  appendIcon?: Component
  /**
   * Named route (or full route location) to navigate to when the item is clicked.
   * Takes precedence over `href` and `onClick` if more than one is provided.
   */
  to?: RouteLocationRaw
  /**
   * External URL to link to when the item is clicked, rendered as an `<a>` opening in a new tab.
   * Takes precedence over `onClick` if both are provided. Ignored if `to` is also provided.
   */
  href?: string
  /** Click handler, used when the item does not navigate to a route or link to a URL. */
  onClick?: () => void
  /**
   * Defaults to icon left and text right.
   * `vertical` stacks the icon, title, and description vertically and centers them.
   */
  variant?: 'default' | 'vertical'
}

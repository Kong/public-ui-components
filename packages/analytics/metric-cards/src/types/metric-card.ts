import type { MetricCardType } from '../enums'
import type { MetricCardSize } from '../constants'
// Import any one of the `@kong/icons` components to access the interface - they are all the same.
// Then alias as `GenericIcon` to provide the icon interface to the prop types.
import type { KongIcon as GenericIcon } from '@kong/icons'

export interface MetricCardDef {
  cardType?: MetricCardType
  currentValue: number
  previousValue: number
  increaseIsBad: boolean
  formatValueFn?: (rawValue: number) => string
  formatChangeFn?: (rawValue: number) => string
  description?: string
  title?: string
  hasError?: boolean
  tooltip?: string
  trendRange?: string
}

export interface MetricCardDisplayValue {
  metricValue: string
  metricChange: string
  changePolarity: number
  trendIcon?: typeof GenericIcon
  cardSize?: MetricCardSize
}

export interface MetricCardContainerOptions {
  cards: Array<MetricCardDef>
  fallbackDisplayText: string
  hasTrendAccess: boolean
  loading: boolean
  cardSize?: MetricCardSize
  errorMessage?: string
}

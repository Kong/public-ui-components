import type { MetricCardType, MetricCardSize } from '../enums'
export interface MetricCardDef {
  cardType: MetricCardType
  currentValue: number
  previousValue: number
  increaseIsBad: boolean
  formatValueFn?: (rawValue: number) => string
  formatChangeFn?: (rawValue: number) => string
  title?: string
  hasError?: boolean
  tooltip?: string
  trendRange?: string
}

export interface MetricCardDisplayValue {
  metricValue: string
  metricChange: string
  changePolarity: number
  trendIcon?: any
  cardSize?: string
}

export interface MetricCardContainerOptions {
  cards: Array<MetricCardDef>
  fallbackDisplayText: string
  hasTrendAccess: boolean
  loading: boolean
  cardSize?: MetricCardSize
  errorMessage?: string
}

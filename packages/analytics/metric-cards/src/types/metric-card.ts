import { MetricCardSize } from '../constants'
export interface MetricCardDef {
  currentValue: number
  previousValue: number
  increaseIsBad: boolean
  formatValueFn?: (rawValue: number) => string
  formatChangeFn?: (rawValue: number) => string
  title?: string
  hasError?: boolean
  tooltip?: string
}

export interface MetricCardDisplayValue {
  metricValue: string
  metricChange: string
  changePolarity: number
  icon?: string
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

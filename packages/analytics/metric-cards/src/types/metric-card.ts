export interface MetricsCardDef {
  currentValue: number
  previousValue: number
  increaseIsBad: boolean
  formatValueFn?: (rawValue: number) => string
  formatChangeFn?: (rawValue: number) => string
  title?: string
  hasError?: boolean
  errorMessage?: string
  cardSize?: string
  tooltip?: string
}

export interface MetricsCardDisplayValue {
  metricValue: string
  metricChange: string
  changePolarity: number
  icon?: string
  cardSize?: string
}

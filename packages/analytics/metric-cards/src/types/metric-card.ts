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
}

export interface Metrics {
  title: string
  tooltip: string
  timeframe: string
  metricValue: string
  metricChange: string
  changePolarity: string
  icon: string
}

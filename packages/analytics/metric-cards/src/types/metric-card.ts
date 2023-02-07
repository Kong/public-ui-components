export interface MetricsCardDef {
  currentValue: number
  previousValue: number
  increaseIsBad: boolean
  formatValueFn?: (rawValue: number) => string
  formatChangeFn?: (rawValue: number) => string
  title?: string
  subtitle?: string
  errorMessage?: string
  cardSize?: string
}

export interface Metrics {
  title: string
  subtitle: string
  tooltip: string
  timeframe: string
  metricValue: string
  metricChange: string
  changePolarity: string
  icon: string
}

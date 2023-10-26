export interface TimePeriod {
  key: string // unique identifier
  display: string
  timeframeText: string
  rangeDisplayText: string
  timeframeLength: () => string
  start: () => Date
  end: () => Date
}

export type ThresholdType = 'warning' | 'error' | 'neutral'

export interface Threshold {
  type: ThresholdType
  value: number
  label?: string
  highlightIntersections?: boolean
}

export interface ExternalLink {
  href: string
}

import type { SpanNode } from './spans'

export interface WaterfallConfig {
  ticks: number
  root?: SpanNode
  /**
   * The duration calculated by subtracting the earliest start time from the latest end time from the
   * spans. It should be the longest duration that wraps all the spans.
   */
  totalDurationNano: number
  /** Zoom level */
  zoom: number
  viewport: { left: number, right: number }
  selectedSpan?: SpanNode
}

export interface WaterfallLegendItem {
  color: string
}

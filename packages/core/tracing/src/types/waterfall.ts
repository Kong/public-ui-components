import type { SpanNode } from './spans'

export interface WaterfallConfig {
  ticks: number;
  totalDurationNano: number;
  startTimeUnixNano: number;
  /** Zoom level */
  zoom: number;
  /**
   * Horizontal shift of the viewport in pixels (used by zooming)
   * Values & directions: <-- negative -- positive -->
   */
  viewportShift: number;
  viewport: { left: number; right: number };
  selectedSpan?: SpanNode;
}

export interface WaterfallLegendItem {
  color: string;
}

import type { Span } from './spans'

export interface ScopeSpan {
  scope: any // don't care for now
  spans: Span[]
}

export interface TraceBatch {
  resource: any // don't care for now
  scopeSpans: ScopeSpan[]
}

export interface TraceBatches {
  batches: TraceBatch[]
}

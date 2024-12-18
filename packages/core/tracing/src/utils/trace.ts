import type { IKeyValue, Span, TraceBatches } from '../types'

interface InternalSpan extends Span {
  dedupedAttributes?: Map<string, IKeyValue> // internally used
}

export const mergeSpans = (spans: Span[]): Span[] => {
  const dedupedSpans = new Map<string, InternalSpan>() // [`${traceId}-${spanId}`: InternalSpan]

  for (const span of spans) {
    const uniqId = `${span.traceId}-${span.spanId}`
    let dds = dedupedSpans.get(uniqId)
    if (!dds) {
      dds = {
        ...span,
        dedupedAttributes: new Map(),
      }
      dedupedSpans.set(uniqId, dds)
    } else if (Array.isArray(span.events)) {
      if (!Array.isArray(dds.events)) {
        dds.events = [...span.events]
      } else {
        dds.events.push(...span.events!)
      }
    }

    if (Array.isArray(dds.attributes)) {
      for (const attr of dds.attributes) {
        dds.dedupedAttributes?.set(attr.key, attr)
      }
    }
  }

  return Array.from(dedupedSpans.values()).map((dds) => {
    const { dedupedAttributes, ...span } = dds
    return {
      ...span,
      attributes: dedupedAttributes ? Array.from(dedupedAttributes.values()) : span.attributes,
    }
  })
}

export const mergeSpansInTraceBatches = (traceBatches: TraceBatches): Span[] =>
  mergeSpans(
    traceBatches.batches.reduce<Span[]>((spans, batch) => {
      for (const scopeSpan of batch.scopeSpans) {
        spans.push(...scopeSpan.spans)
      }
      return spans
    }, []),
  )

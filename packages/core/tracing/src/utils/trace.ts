import type { Trace, Span } from '@kong/sdk-konnect-js-internal'

export const mergeSpans = (spans: Span[]): Span[] => {
  const dedupedSpans = new Map<string, Span>() // [`${traceId}-${spanId}`: InternalSpan]

  for (const span of spans) {
    const uniqId = `${span.trace_id}-${span.span_id}`
    let dds = dedupedSpans.get(uniqId)
    if (!dds) {
      dds = { ...span }
      dedupedSpans.set(uniqId, dds)
    } else if (Array.isArray(span.events)) {
      if (!Array.isArray(dds.events)) {
        dds.events = [...span.events]
      } else {
        dds.events.push(...span.events!)
      }
    }
  }

  return Array.from(dedupedSpans.values())
}

export const mergeSpansInTrace = (trace: Trace): Span[] => {
  if (!trace.resource_spans || trace.resource_spans.length === 0) {
    return []
  }

  return mergeSpans(trace.resource_spans.reduce<Span[]>((spans, resourceSpan) => {
    // Check if scope_spans is defined and has items
    if (resourceSpan.scope_spans?.length) {
      for (const scopeSpan of resourceSpan.scope_spans) {
        // Check if spans is defined and has atleast one valid span
        if (scopeSpan.spans?.length && scopeSpan.spans[0]?.span_id) {
          spans.push(...scopeSpan.spans)
        }
      }
    }
    return spans
  }, []))
}

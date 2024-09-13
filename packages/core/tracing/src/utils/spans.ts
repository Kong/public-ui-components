import type { IAnyValue } from '@opentelemetry/otlp-transformer'
import { SPAN_ZERO_ID } from '../constants'
import { type Span, type SpanNode } from '../types'

/**
 * Iterate over the spans and build span trees, where each tree stores a trace.
 *
 * @param spans the spans to build the trees from
 * @returns the array of root nodes of the span trees
 */
export const buildSpanTrees = (spans: Span[]): SpanNode[] => {
  const nodes = new Map<string, SpanNode>()

  for (const span of spans) {
    nodes.set(span.spanId, {
      span,
      root: !span.parentSpanId || span.parentSpanId === SPAN_ZERO_ID,
      durationNano: span.endTimeUnixNano - span.startTimeUnixNano,
      children: [],
    })
  }

  const roots: SpanNode[] = []

  for (const node of nodes.values()) {
    if (!node.root) {
      const parent = nodes.get(node.span.parentSpanId!)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  for (const node of nodes.values()) {
    node.children.sort((a, b) => a.span.startTimeUnixNano - b.span.startTimeUnixNano)
  }

  return roots
}

/**
 * Parse the plugin name and phase from a span name.
 *
 * @param spanName the span name to parse
 * @returns the parsed phase and plugin or undefined if the span is not a plugin span
 */
export const getPhaseAndPlugin = (spanName: string): [phase: string, plugin: string] | undefined => {
  const matches = /^kong\.(rewrite|access|response|header_filter|body_filter)\.plugin\.(.+?)(?:$|\..*)/gi.exec(spanName)
  if (!matches) {
    return undefined
  }
  return [matches[1], matches[2]]
}

export const unwrapAnyValue = <T = any> (value: IAnyValue): T | null => {
  if (value.stringValue !== undefined) {
    return `${value.stringValue}` as T
  }

  if (value.boolValue !== undefined) {
    return value.boolValue as T
  }

  if (value.intValue !== undefined) {
    return value.intValue as T
  }

  if (value.doubleValue !== undefined) {
    return value.doubleValue as T
  }

  if (value.bytesValue !== undefined) {
    return value.bytesValue as T
  }

  if (value.arrayValue !== undefined) {
    return value.arrayValue.values.map(unwrapAnyValue) as T
  }

  if (value.kvlistValue !== undefined) {
    return value.kvlistValue.values.reduce<Record<string, any>>((map, value) => {
      map[value.key] = unwrapAnyValue(value.value)
      return map
    }, {}) as T
  }

  return null
}

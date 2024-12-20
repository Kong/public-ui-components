import { cloneDeep } from 'lodash-es'
import { SPAN_ZERO_ID } from '../constants'
import { type IAnyValue, type Span, type SpanNode } from '../types'

/**
 * These are spans whose names are changed.
 * Here we will map them to their new names, and use them in the following steps.
 */
const MAPPED_SPAN_NAMES: Record<string, string> = {
  'kong.upstream.try_select': 'kong.find_upstream',
  'kong.upstream.ttfb': 'kong.waiting_for_upstream',
  'kong.upstream.read_response': 'kong.read_response_from_upstream',
}

/**
 * Iterate over the spans and build span trees, where each tree stores a trace.
 *
 * @param spans the spans to build the trees from
 * @returns the array of root nodes of the span trees
 */
export const buildSpanTrees = (spans: Span[]): SpanNode[] => {
  const nodes = new Map<string, SpanNode>()

  for (const span of spans) {
    // Performance: Only pick the necessary fields
    const {
      traceId,
      spanId,
      parentSpanId,
      name,
      attributes,
      events,
    } = span

    let startTimeUnixNano: bigint | undefined
    let endTimeUnixNano: bigint | undefined

    try {
      startTimeUnixNano = BigInt(span.startTimeUnixNano!)
    } catch (e) {
      console.warn(`Failed to convert the start time "${span.startTimeUnixNano}" to bigint:`, { error: e, span })
    }

    try {
      endTimeUnixNano = BigInt(span.endTimeUnixNano!)
    } catch (e) {
      console.warn(`Failed to convert the end time "${span.endTimeUnixNano}" to bigint:`, { error: e, span })
    }

    const durationNano = startTimeUnixNano !== undefined && endTimeUnixNano !== undefined
      ? Number(endTimeUnixNano - startTimeUnixNano)
      : undefined

    if (durationNano !== undefined && durationNano < 0) {
      console.warn(`Invalid span duration "${durationNano}":`, { span })
    }

    const node: SpanNode = {
      span: {
        traceId,
        spanId,
        parentSpanId,
        name: MAPPED_SPAN_NAMES[name] || name,
        startTimeUnixNano,
        endTimeUnixNano,
        attributes: cloneDeep(attributes), // Avoid mutating the original attributes
        events: cloneDeep(events), // Avoid mutating the original events
      },
      root: !span.parentSpanId || span.parentSpanId === SPAN_ZERO_ID,
      durationNano, // undefined indicates either the start or end time is missing or invalid
      children: [],
      subtreeValues: {
        startTimeUnixNano,
        endTimeUnixNano,
      },
    }
    node.span.attributes?.sort((a, b) => a.key.localeCompare(b.key))
    nodes.set(span.spanId, node)
  }

  const roots: SpanNode[] = []

  for (const node of nodes.values()) {
    if (!node.root) {
      const parent = nodes.get(node.span.parentSpanId!)!
      parent.children.push(node)
      // Update subtree values when necessary
      if (node.subtreeValues.startTimeUnixNano !== undefined
        && (parent.subtreeValues.startTimeUnixNano === undefined
          || node.subtreeValues.startTimeUnixNano < parent.subtreeValues.startTimeUnixNano)) {
        parent.subtreeValues.startTimeUnixNano = node.subtreeValues.startTimeUnixNano
      }
      if (node.subtreeValues.endTimeUnixNano !== undefined
        && (parent.subtreeValues.endTimeUnixNano === undefined
          || node.subtreeValues.endTimeUnixNano > parent.subtreeValues.endTimeUnixNano)) {
        parent.subtreeValues.endTimeUnixNano = node.subtreeValues.endTimeUnixNano
      }
    } else {
      roots.push(node)
    }
  }

  for (const node of nodes.values()) {
    node.children.sort((a, b) => {
      if (a.span.startTimeUnixNano !== undefined && b.span.startTimeUnixNano !== undefined) {
        return Number(a.span.startTimeUnixNano - b.span.startTimeUnixNano)
      }
      // Hoist the spans without start time to the top
      if (a.span.startTimeUnixNano === undefined && b.span.startTimeUnixNano === undefined) {
        return 0
      }
      return a.span.startTimeUnixNano === undefined ? -1 : 1
    })
  }

  return roots
}

/**
 * Detect if a span is incomplete. The result is not guaranteed to be accurate.
 */
export const spanMaybeIncomplete = (node: SpanNode): boolean =>
  node.durationNano === undefined || node.durationNano < 0

// e.g., `kong.access.plugin.jwt.abc.def`
export interface ParsedPluginSpan {
  phase: string // e.g., `access`
  plugin: string // e.g., `jwt`
  suffix?: string // e.g., `.abc.def`
}

/**
 * Parse the plugin name and phase from a span name.
 *
 * @param spanName the span name to parse
 * @returns the parsed phase and plugin or undefined if the span is not a plugin span
 */
export const getPhaseAndPlugin = (spanName: string): ParsedPluginSpan | undefined => {
  const matches = /^kong\.([^.]+)\.plugin\.([^.]+)(?:$|(.*))/gi.exec(spanName)
  if (!matches) {
    return undefined
  }

  return {
    phase: matches[1],
    plugin: matches[2],
    suffix: matches[3],
  }
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

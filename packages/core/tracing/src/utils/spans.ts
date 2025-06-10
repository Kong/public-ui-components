import { cloneDeep } from 'lodash-es'
import { SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX, SPAN_ATTRIBUTE_KEYS, SPAN_LATENCY_ATTR_LABEL_KEYS, SPAN_NAMES, SPAN_ZERO_ID } from '../constants'
import { type IAnyValue, type IKeyValue, type SpanLatency, type SpanNode, type SpanTrees } from '../types'
import type { Span } from '@kong/sdk-konnect-js-internal'

/**
 * These are spans whose names are changed.
 * Here we will map them to their new names, and use them in the following steps.
 */
const MAPPED_SPAN_NAMES: Record<string, string> = {
  'kong.upstream.try_select': SPAN_NAMES.FIND_UPSTREAM,
  'kong.upstream.ttfb': SPAN_NAMES.KONG_READ_HEADERS_FROM_UPSTREAM,
  [SPAN_NAMES.KONG_WAITING_FOR_UPSTREAM]: SPAN_NAMES.KONG_READ_HEADERS_FROM_UPSTREAM,
  'kong.upstream.read_response': SPAN_NAMES.KONG_READ_BODY_FROM_UPSTREAM,
  [SPAN_NAMES.KONG_READ_RESPONSE_FROM_UPSTREAM]: SPAN_NAMES.KONG_READ_BODY_FROM_UPSTREAM,
}

export const compareSpanNode = (a: SpanNode, b: SpanNode): number => {
  if (a.span.start_time_unix_nano !== undefined && b.span.start_time_unix_nano !== undefined) {
    return Number(BigInt(a.span.start_time_unix_nano) - BigInt(b.span.start_time_unix_nano))
  }
  // Hoist the spans without start time to the top
  if (a.span.start_time_unix_nano === undefined && b.span.start_time_unix_nano === undefined) {
    return 0
  }
  return a.span.start_time_unix_nano === undefined ? -1 : 1
}

export const calculateSpanDuration = (span: Span): number | undefined => {
  let start_time_unix_nano: bigint | undefined
  let end_time_unix_nano: bigint | undefined

  try {
    start_time_unix_nano = BigInt(span.start_time_unix_nano!)
  } catch (e) {
    console.warn(`Failed to convert the start time "${span.start_time_unix_nano}" to bigint:`, { error: e, span })
    return undefined
  }

  try {
    end_time_unix_nano = BigInt(span.end_time_unix_nano!)
  } catch (e) {
    console.warn(`Failed to convert the end time "${span.end_time_unix_nano}" to bigint:`, { error: e, span })
    return undefined
  }

  const durationNano = start_time_unix_nano !== undefined && end_time_unix_nano !== undefined
    ? Number(end_time_unix_nano - start_time_unix_nano)
    : undefined

  if (durationNano !== undefined && durationNano < 0) {
    console.warn(`Invalid span duration "${durationNano}":`, { span })
  }

  return durationNano
}

/**
 * Iterate over the spans and build span trees, where each tree stores a trace.
 *
 * @param spans the spans to build the trees from
 * @returns the array of root nodes of the span trees
 */
export const buildSpanTrees = (spans: Span[]): SpanTrees => {
  const nodes = new Map<string, SpanNode>()

  for (const span of spans) {
    // Performance: Only pick the necessary fields
    const {
      trace_id,
      span_id,
      parent_span_id,
      name,
      attributes,
      events,
    } = span

    let start_time_unix_nano: bigint | undefined
    let end_time_unix_nano: bigint | undefined

    try {
      start_time_unix_nano = BigInt(span.start_time_unix_nano!)
    } catch (e) {
      console.warn(`Failed to convert the start time "${span.start_time_unix_nano}" to bigint:`, { error: e, span })
    }

    try {
      end_time_unix_nano = BigInt(span.end_time_unix_nano!)
    } catch (e) {
      console.warn(`Failed to convert the end time "${span.end_time_unix_nano}" to bigint:`, { error: e, span })
    }

    const durationNano = start_time_unix_nano !== undefined && end_time_unix_nano !== undefined
      ? Number(end_time_unix_nano - start_time_unix_nano)
      : undefined

    if (durationNano !== undefined && durationNano < 0) {
      console.warn(`Invalid span duration "${durationNano}":`, { span })
    }

    const node: SpanNode = {
      span: {
        trace_id,
        span_id,
        parent_span_id,
        name: name ? MAPPED_SPAN_NAMES[name] || name : 'N/A',
        start_time_unix_nano: String(start_time_unix_nano),
        end_time_unix_nano: String(end_time_unix_nano),
        attributes: cloneDeep(attributes), // Avoid mutating the original attributes
        events: cloneDeep(events), // Avoid mutating the original events
      },
      root: !span.parent_span_id || span.parent_span_id === SPAN_ZERO_ID,
      durationNano, // undefined indicates either the start or end time is missing or invalid
      children: [],
      subtreeValues: {
        startTimeUnixNano: String(start_time_unix_nano),
        endTimeUnixNano: String(end_time_unix_nano),
      },
    }
    nodes.set(`${span.trace_id}~${span.span_id}`, node)
  }

  const roots: SpanNode[] = []

  for (const node of nodes.values()) {
    if (!node.root) {
      const parent = nodes.get(`${node.span.trace_id}~${node.span.parent_span_id!}`)!
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
    node.children.sort(compareSpanNode)
  }

  return {
    roots,
    spans: Array.from(nodes.values()).sort(compareSpanNode).map(node => node.span),
  }
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
export const getPhaseAndPlugin = (spanName?: string): ParsedPluginSpan | undefined => {
  if (!spanName) {
    return undefined
  }

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

const LATENCY_ORDERING = [
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL,
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL_MS_LEGACY,
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_INTERNAL,
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_UPSTREAM,
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_TOTAL_IO,
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_CLIENT,
].reduce((map, key, index) => {
  map[key] = index
  return map
}, {} as Record<string, number>)

/**
 * IMPORTANT: Please pass the attributes of a root span.
 */
export const toOverviewLatencies = (attributes?: Span['attributes']): SpanLatency[] => {
  if (!attributes) {
    return []
  }

  const spanLatencyList: SpanLatency[] = []
  const attrs = attributes as Record<string, any> // Assert type to access properties dynamically

  for (const key in attrs) {
    if (!Object.prototype.hasOwnProperty.call(LATENCY_ORDERING, key)) {
      continue
    }

    spanLatencyList.push({
      key: key,
      labelKey: SPAN_LATENCY_ATTR_LABEL_KEYS[key],
      milliseconds: attrs[key] as number,
    })
  }

  return spanLatencyList.sort((a, b) => LATENCY_ORDERING[a.key] - LATENCY_ORDERING[b.key])
}

export const toSpanLatencies = (attributes?: IKeyValue[]): SpanLatency<SpanLatency[]>[] => {
  if (!attributes) {
    return []
  }

  const latencies: SpanLatency<SpanLatency[]>[] = []
  let latency3rdParty: SpanLatency<SpanLatency[]> | undefined
  const latencies3rdParty: SpanLatency[] = []

  for (const attr of attributes) {
    if (Object.prototype.hasOwnProperty.call(LATENCY_ORDERING, attr.key)) {
      // Handle the major latencies
      const latency: SpanLatency<SpanLatency[]> = {
        key: attr.key,
        labelKey: SPAN_LATENCY_ATTR_LABEL_KEYS[attr.key],
        milliseconds: unwrapAnyValue(attr.value) as number,
        children: [],
      }
      if (attr.key === SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_3P_TOTAL_IO) {
        latency3rdParty = latency
      }
      latencies.push(latency)
    } else if (attr.key.startsWith(SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX)) {
      // Handle the NESTED 3rd-party latencies; we will later add them to the major 3rd-party latency
      latencies3rdParty.push({
        key: attr.key,
        labelKey:  SPAN_LATENCY_ATTR_LABEL_KEYS[attr.key],
        milliseconds: unwrapAnyValue(attr.value) as number,
      })
    }
  }

  if (latency3rdParty) {
    latency3rdParty.children = latencies3rdParty
  }

  return latencies.sort((a, b) => LATENCY_ORDERING[a.key] - LATENCY_ORDERING[b.key])
}

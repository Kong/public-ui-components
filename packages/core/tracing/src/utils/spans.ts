import { cloneDeep } from 'lodash-es'
import { SPAN_ATTR_KEY_KONG_LATENCY_3P_PREFIX, SPAN_ATTRIBUTE_KEYS, SPAN_LATENCY_ATTR_LABEL_KEYS, SPAN_NAMES, SPAN_ZERO_ID } from '../constants'
import { type IAnyValue, type IKeyValue, type Span, type SpanLatency, type SpanNode, type SpanTrees } from '../types'

/**
 * These are spans whose names are changed.
 * Here we will map them to their new names, and use them in the following steps.
 */
const MAPPED_SPAN_NAMES: Record<string, string> = {
  'kong.upstream.try_select': SPAN_NAMES.FIND_UPSTREAM,
  'kong.upstream.ttfb': SPAN_NAMES.KONG_WAITING_FOR_UPSTREAM,
  'kong.upstream.read_response': SPAN_NAMES.KONG_READ_RESPONSE_FROM_UPSTREAM,
}

const compareSpanNode = (a: SpanNode, b: SpanNode) => {
  if (a.span.startTimeUnixNano !== undefined && b.span.startTimeUnixNano !== undefined) {
    return Number(a.span.startTimeUnixNano - b.span.startTimeUnixNano)
  }
  // Hoist the spans without start time to the top
  if (a.span.startTimeUnixNano === undefined && b.span.startTimeUnixNano === undefined) {
    return 0
  }
  return a.span.startTimeUnixNano === undefined ? -1 : 1
}

export const calculateSpanDuration = (span: Span<bigint>): number | undefined => {
  let startTimeUnixNano: bigint | undefined
  let endTimeUnixNano: bigint | undefined

  try {
    startTimeUnixNano = BigInt(span.startTimeUnixNano!)
  } catch (e) {
    console.warn(`Failed to convert the start time "${span.startTimeUnixNano}" to bigint:`, { error: e, span })
    return undefined
  }

  try {
    endTimeUnixNano = BigInt(span.endTimeUnixNano!)
  } catch (e) {
    console.warn(`Failed to convert the end time "${span.endTimeUnixNano}" to bigint:`, { error: e, span })
    return undefined
  }

  const durationNano = startTimeUnixNano !== undefined && endTimeUnixNano !== undefined
    ? Number(endTimeUnixNano - startTimeUnixNano)
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
    nodes.set(`${span.traceId}~${span.spanId}`, node)
  }

  const roots: SpanNode[] = []

  for (const node of nodes.values()) {
    if (!node.root) {
      const parent = nodes.get(`${node.span.traceId}~${node.span.parentSpanId!}`)!
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

const LATENCY_ORDERING = [
  SPAN_ATTRIBUTE_KEYS.KONG_LATENCY_TOTAL,
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
export const toOverviewLatencies = (attributes?: IKeyValue[]): SpanLatency[] => {
  if (!attributes) {
    return []
  }

  return attributes
    .reduce((attrs, attr) => {
      if (!Object.prototype.hasOwnProperty.call(LATENCY_ORDERING, attr.key)) {
        return attrs
      }

      attrs.push({
        key: attr.key,
        labelKey: SPAN_LATENCY_ATTR_LABEL_KEYS[attr.key],
        milliseconds: unwrapAnyValue(attr.value) as number,
      })

      return attrs
    }, [] as SpanLatency[])
    .sort((a, b) => LATENCY_ORDERING[a.key] - LATENCY_ORDERING[b.key])
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

import { MarkerType, type Edge } from '@vue-flow/core'
import { KONG_PHASES, LifecycleNodeType, SPAN_NAMES } from '../constants'
import type { LifecycleGraph, LifecycleNodeData, SpanNode } from '../types'
import { getPhaseAndPlugin } from './spans'
import { getDurationFormatter } from './time'

/**
 * Traverse a plugin span tree and build the {@link LifecycleNodeData} for the plugin and accumulate
 * the duration that has been excluded from the returned result.
 *
 * Currently, nested duration of {@link SPAN_NAMES.CLIENT_HEADERS} and {@link SPAN_NAMES.READ_BODY}
 * will be excluded from the returned result.
 *
 * @param node The root node of the plugin span tree
 * @returns the node data and the duration that has been excluded
 */
const buildPluginNodeData = (node: SpanNode): [LifecycleNodeData, number] | undefined => {
  // Try to parse the phase and plugin name from the span name
  const pluginSpan = getPhaseAndPlugin(node.span.name)
  if (!pluginSpan || pluginSpan.suffix) {
    // 1. `undefined` indicates that the span is not a plugin span; we should skip it
    // 2. Only process the root span of the plugin phase
    return undefined
  }

  let nodeType = LifecycleNodeType.REQUEST // We will update this later
  switch (pluginSpan.phase) {
    case KONG_PHASES.CERTIFICATE:
    case KONG_PHASES.REWRITE:
    case KONG_PHASES.ACCESS:
      nodeType = LifecycleNodeType.REQUEST
      break
    case KONG_PHASES.RESPONSE:
    case KONG_PHASES.HEADER_FILTER:
    case KONG_PHASES.BODY_FILTER:
      nodeType = LifecycleNodeType.RESPONSE
      break
    default:
      // Indicates that the phase is not recognized; we should skip it
      return undefined
  }

  let durationExcluded = 0
  let durationNano = node.durationNano ?? 0

  const stack: SpanNode[] = [node]
  while (stack.length > 0) {
    const n = stack.pop()!
    switch (n.span.name) {
      case SPAN_NAMES.CLIENT_HEADERS:
      case SPAN_NAMES.READ_BODY:
        durationNano -= n.durationNano ?? 0
        durationExcluded += n.durationNano ?? 0
        // No need to visit the child nodes
        continue
      default:
        // No-op
        break
    }
    stack.push(...n.children)
  }

  return [{
    label: pluginSpan.plugin,
    type: nodeType,
    badge: pluginSpan.phase,
    durationNano,
    spans: [node],
  }, durationExcluded]
}

export const buildLifecycleGraph = (root: SpanNode): LifecycleGraph => {
  const fmt = getDurationFormatter()
  const ingressSpans: SpanNode[] = []
  const egressSpans: SpanNode[] = []
  const requestNodesData: LifecycleNodeData[] = []
  const responseNodesData: LifecycleNodeData[] = []
  const upstreamSpans: SpanNode[] = []

  let pluginDurationExcluded = 0

  const stack: SpanNode[] = [...root.children]
  while (stack.length > 0) {
    const n = stack.pop()!
    switch (n.span.name) {
      case SPAN_NAMES.CLIENT_HEADERS:
      case SPAN_NAMES.READ_BODY:
        if (n.span.parentSpanId === root.span.spanId) {
          ingressSpans.push(n)
        }
        break
      case SPAN_NAMES.FLUSH_TO_DOWNSTREAM:
        if (n.span.parentSpanId === root.span.spanId) {
          egressSpans.push(n)
        }
        break
      case SPAN_NAMES.KONG_UPSTREAM_SELECTION:
      case SPAN_NAMES.KONG_READ_HEADERS_FROM_UPSTREAM:
      case SPAN_NAMES.KONG_READ_BODY_FROM_UPSTREAM:
        upstreamSpans.push(n)
        break
      default: {
        const builtData = buildPluginNodeData(n)
        if (builtData) {
          const [nodeData, durationExcluded] = builtData
          switch (nodeData.type) {
            case LifecycleNodeType.REQUEST:
              requestNodesData.push(nodeData)
              pluginDurationExcluded += durationExcluded
              break
            case LifecycleNodeType.RESPONSE:
              responseNodesData.push(nodeData)
              pluginDurationExcluded += durationExcluded
              break
            default:
              throw new Error('unreachable')
          }
        } else {
          stack.push(...n.children)
        }
      }
    }
  }

  const graph: LifecycleGraph = {
    nodes: [],
    edges: [],
  }

  graph.nodes.push({
    id: 'client',
    position: { x: 0, y: 0 },
    data: {
      label: 'Client',
      type: LifecycleNodeType.CLIENT,
    },
  })

  requestNodesData.forEach((nodeData, i) => {
    graph.nodes.push({
      id: `request#${i}`,
      position: { x: 0, y: 0 },
      data: nodeData,
    })
  })

  graph.nodes.push({
    id: 'upstream',
    position: { x: 0, y: 0 },
    data: {
      label: 'Upstream',
      type: LifecycleNodeType.UPSTREAM,
      durationNano: upstreamSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0),
    },
  })

  responseNodesData.forEach((nodeData, i) => {
    graph.nodes.push({
      id: `response#${i}`,
      position: { x: 0, y: 0 },
      data: nodeData,
    })
  })

  for (let i = 0; i < graph.nodes.length; i++) {
    const j = i < graph.nodes.length - 1 ? i + 1 : 0
    const edge: Edge = {
      id: `${graph.nodes[i].id}->${graph.nodes[j].id}`,
      source: graph.nodes[i].id,
      target: graph.nodes[j].id,
      type: 'smoothstep',
      markerEnd: MarkerType.ArrowClosed,
    }
    if (i === 0) {
      edge.label = fmt(ingressSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0) + pluginDurationExcluded)
    } else if (i === graph.nodes.length - 1) {
      edge.label = fmt(egressSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0))
    }
    graph.edges.push(edge)
  }

  return graph
}

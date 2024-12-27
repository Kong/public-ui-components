import { MarkerType, type Edge } from '@vue-flow/core'
import { KONG_PHASES, LifecycleNodeType, SPAN_NAMES } from '../constants'
import type { LifecycleGraph, LifecycleNodeData, Span, SpanNode } from '../types'
import { getPhaseAndPlugin } from './spans'
import { formatLatency } from './time'

// export const buildLifecycleGraphEdges = (nodes: Node[]): Edge[] => {
//   const edges: Edge[] = []
//   for (let i = 0; i < nodes.length - 1; i++) {
//     edges.push({
//       id: `e${nodes[i].id}->${nodes[i + 1].id}`,
//       source: nodes[i].id,
//       target: nodes[i + 1].id,
//       type: 'smoothstep',
//       // animated: true,
//       markerEnd: MarkerType.ArrowClosed,
//     })
//   }
//   return edges
// }

// export const buildLifecycleGraph = (nodeData: LifecycleNodeData[]): LifecycleGraph => {
//   const nodes: LifecycleNode[] = nodeData.map((data, i) => ({
//     id: `${i}`,
//     position: { x: 0, y: 0 },
//     data,
//   }))
//   const edges = buildLifecycleGraphEdges(nodes)

//   return { nodes, edges }
// }

const SPAN_NAME_KONG_UPSTREAM_PREFIX = 'kong.upstream.'

export const getNodeType = (spanName: string): LifecycleNodeType => {
  if (spanName.startsWith(SPAN_NAME_KONG_UPSTREAM_PREFIX)) {
    return LifecycleNodeType.UPSTREAM
  }
  return LifecycleNodeType.REQUEST
}

const buildPluginNodeData = (node: SpanNode): LifecycleNodeData | undefined => {
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

  let durationNano = node.durationNano ?? 0

  const calculateDuration = (node: SpanNode) => {
    if (node.span.name === SPAN_NAMES.READ_BODY) {
      durationNano -= node.durationNano ?? 0
      return
    }
    node.children.forEach(calculateDuration)
  }

  calculateDuration(node)

  return {
    label: `${pluginSpan.plugin} (${pluginSpan.phase})`,
    type: nodeType,
    durationNano,
    spans: [node],
  }
}

export const buildLifecycleGraph = (root: SpanNode): LifecycleGraph => {
  const ingressSpans: SpanNode[] = []
  const egressSpans: SpanNode[] = []
  const requestNodesData: LifecycleNodeData[] = []
  const responseNodesData: LifecycleNodeData[] = []
  const upstreamSpans: Span<bigint>[] = []

  const traverse = (node: SpanNode) => {
    if (node.span.name === SPAN_NAMES.CLIENT_HEADERS || node.span.name === SPAN_NAMES.READ_BODY) {
      if (node.span.parentSpanId === root.span.spanId) {
        ingressSpans.push(node)
      }
    } else if (node.span.name === SPAN_NAMES.FLUSH_TO_DOWNSTREAM) {
      if (node.span.parentSpanId === root.span.spanId) {
        egressSpans.push(node)
      }
    } else if (node.span.name.startsWith(SPAN_NAME_KONG_UPSTREAM_PREFIX)) {
      upstreamSpans.push(node.span)
    } else {
      const pluginNodeData = buildPluginNodeData(node)
      if (pluginNodeData) {
        switch (pluginNodeData.type) {
          case LifecycleNodeType.REQUEST:
            requestNodesData.push(pluginNodeData)
            break
          case LifecycleNodeType.RESPONSE:
            responseNodesData.push(pluginNodeData)
            break
          default:
            throw new Error('unreachable')
        }
        return
      }
      node.children.forEach(traverse)
    }
  }

  root.children.forEach(traverse)

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
      // animated: true,
      markerEnd: MarkerType.ArrowClosed,
    }
    if (i === 0) {
      edge.label = formatLatency(ingressSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0) / 1000)
    } else if (i === graph.nodes.length - 1) {
      edge.label = formatLatency(egressSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0) / 1000)
      // edge.sourceHandle = 'left'
      // edge.targetHandle = 'right'
      continue
    }
    graph.edges.push(edge)
  }

  return graph
}

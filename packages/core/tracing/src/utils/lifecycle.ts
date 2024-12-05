import { MarkerType, type Edge, type Node } from '@vue-flow/core'
import type { LifecycleGraph, LifecycleNode, LifecycleNodeData, Span } from '../types'
import { calculateSpanDuration, getPhaseAndPlugin } from './spans'
import { LifecycleNodeType } from '../constants'

export const buildLifecycleGraphEdges = (nodes: Node[]): Edge[] => {
  const edges: Edge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e${nodes[i].id}->${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: 'smoothstep',
      // animated: true,
      markerEnd: MarkerType.ArrowClosed,
    })
  }
  return edges
}

export const buildLifecycleGraph = (nodeData: LifecycleNodeData[]): LifecycleGraph => {
  const nodes: LifecycleNode[] = nodeData.map((data, i) => ({
    id: `${i}`,
    position: { x: 0, y: 0 },
    data,
  }))
  const edges = buildLifecycleGraphEdges(nodes)

  return { nodes, edges }
}

const SPAN_NAME_KONG_UPSTREAM_PREFIX = 'kong.upstream.'

export const getNodeType = (spanName: string): LifecycleNodeType => {
  if (spanName.startsWith(SPAN_NAME_KONG_UPSTREAM_PREFIX)) {
    return LifecycleNodeType.UPSTREAM
  }
  return LifecycleNodeType.REQUEST
}


export const buildLifecycleNodes = (sortedSpans: Span<bigint>[]): LifecycleNode[] => {
  const requestNodeData: LifecycleNodeData[] = []
  const upstreamSpans: Span<bigint>[] = []
  const responseNodeData: LifecycleNodeData[] = []
  const nodes: LifecycleNode[] = []

  for (const span of sortedSpans) {
    const durationNano = calculateSpanDuration(span)

    if (span.name.startsWith(SPAN_NAME_KONG_UPSTREAM_PREFIX)) {
      upstreamSpans.push(span)
    } else {
      const pluginSpan = getPhaseAndPlugin(span.name)
      let nodeType = LifecycleNodeType.REQUEST

      if (pluginSpan) {
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
            continue // -- for-loop
        }
        requestNodeData.push({
          label: span.name,
          type: nodeType,
          durationNano,
          spans: [span],
        })
      }
    }
  }
}

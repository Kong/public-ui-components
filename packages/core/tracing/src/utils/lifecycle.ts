import { KUI_COLOR_BACKGROUND_DISABLED } from '@kong/design-tokens'
import { MarkerType } from '@vue-flow/core'
import { KONG_PHASES, LifecycleNodeType, NODE_STRIPE_COLOR_MAPPING, NODE_STRIPE_COLOR_MAPPING_START_EXP, SPAN_NAMES } from '../constants'
import type { LifecycleGraph, LifecycleNodeData, SpanNode } from '../types'
import { getPhaseAndPlugin } from './spans'

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
const buildPluginNodeData = (node: SpanNode): [LifecycleNodeData & { id: string }, number] | undefined => {
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
    id: `${pluginSpan.plugin}:${pluginSpan.phase}`, // For reference and node generation only
    label: pluginSpan.plugin,
    type: nodeType,
    badge: pluginSpan.phase,
    durationNano,
    spans: [node],
  }, durationExcluded]
}

export const buildLifecycleGraph = (root: SpanNode): LifecycleGraph => {
  const ingressSpans: SpanNode[] = []
  const egressSpans: SpanNode[] = []
  const requestNodesData: (LifecycleNodeData & { id: string })[] = []
  const responseNodesData: (LifecycleNodeData & { id: string })[] = []
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

  const graph: Omit<LifecycleGraph, 'nodes'> = {
    nodeTree: {
      client: {
        node: {
          id: LifecycleNodeType.CLIENT,
          position: { x: 0, y: 0 },
          data: {
            label: 'Client',
            type: LifecycleNodeType.CLIENT,
            showSourceHandle: true,
          },
          zIndex: 2,
        },
        in: {
          id: LifecycleNodeType.CLIENT_IN,
          position: { x: 0, y: 0 },
          data: {
            type: LifecycleNodeType.CLIENT_IN,
            durationNano: ingressSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0) + pluginDurationExcluded,
            durationTooltipKey: 'lifecycle.client_in.tooltip',
          },
          zIndex: 10, // Because we may want to show tooltips on this node
        },
        out: {
          id: LifecycleNodeType.CLIENT_OUT,
          position: { x: 0, y: 0 },
          data: {
            type: LifecycleNodeType.CLIENT_OUT,
            durationNano: egressSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0),
            durationTooltipKey: 'lifecycle.client_out.tooltip',
          },
          zIndex: 10, // Because we may want to show tooltips on this node
        },
      },
      requests: requestNodesData.length > 0 ? {
        node: {
          id: LifecycleNodeType.REQUEST_GROUP,
          position: { x: 0, y: 0 },
          data: {
            label: 'Requests',
            type: LifecycleNodeType.REQUEST_GROUP,
            labelPlacement: 'top left',
          },
          zIndex: 1,
        },
        children: requestNodesData.map((nodeData, i) => ({
          id: `${LifecycleNodeType.REQUEST}:${nodeData.id}`,
          position: { x: 0, y: 0 },
          parentNode: LifecycleNodeType.REQUEST_GROUP,
          data: {
            ...nodeData,
            showTargetHandle: i > 0,
            showSourceHandle: true,
          },
          zIndex: 1,
        })),
      } : undefined,
      upstream: {
        id: LifecycleNodeType.UPSTREAM,
        position: { x: 0, y: 0 },
        data: {
          label: 'Upstream',
          type: LifecycleNodeType.UPSTREAM,
          durationNano: upstreamSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0),
          showSourceHandle: true,
        },
        zIndex: 1,
      },
      responses: responseNodesData.length > 0 ? {
        node: {
          id: LifecycleNodeType.RESPONSE_GROUP,
          position: { x: 0, y: 0 },
          data: {
            label: 'Responses',
            type: LifecycleNodeType.RESPONSE_GROUP,
            labelPlacement: 'bottom left',
          },
          zIndex: 1,
        },
        children: responseNodesData.map((nodeData, i) => ({
          id: `${LifecycleNodeType.RESPONSE}:${nodeData.id}`,
          position: { x: 0, y: 0 },
          parentNode: LifecycleNodeType.RESPONSE_GROUP,
          data: {
            ...nodeData,
            showTargetHandle: i > 0,
            showSourceHandle: true,
          },
          zIndex: 1,
        })),
      } : undefined,
    },
    edges: [],
  }

  const clientNodes = graph.nodeTree.client

  graph.edges.push({
    id: `${clientNodes.node.id}->${clientNodes.out.id}`,
    source: clientNodes.node.id,
    target: clientNodes.out.id,
    type: 'seamless-smoothstep',
    zIndex: 1,
  })

  if (graph.nodeTree.requests && graph.nodeTree.requests.children.length > 0) {
    const children = graph.nodeTree.requests.children

    graph.edges.push({
      id: `${clientNodes.out.id}->${children[0].id}`,
      source: clientNodes.out.id,
      target: children[0].id,
      type: 'seamless-smoothstep',
      markerEnd: MarkerType.ArrowClosed,
      zIndex: 2,
    })

    for (let i = 0; i < children.length - 1; i++) {
      graph.edges.push({
        id: `${children[i].id}->${children[i + 1].id}`,
        source: children[i].id,
        target: children[i + 1].id,
        type: 'smoothstep', // Using built-in edge type because handles are available on both side–we don't care about the gaps
        zIndex: 2,
      })
    }

    graph.edges.push({
      id: `${children[children.length - 1].id}->${graph.nodeTree.upstream.id}`,
      source: children[children.length - 1].id,
      target: graph.nodeTree.upstream.id,
      type: 'seamless-smoothstep',
      markerEnd: MarkerType.ArrowClosed,
      zIndex: 2,
    })
  } else {
    graph.edges.push(
      {
        id: `${clientNodes.out.id}->${graph.nodeTree.upstream.id}`,
        source: clientNodes.out.id,
        target: graph.nodeTree.upstream.id,
        type: 'seamless-smoothstep',
        markerEnd: MarkerType.ArrowClosed,
        zIndex: 1,
      },
    )
  }

  if (graph.nodeTree.responses) {
    const children = graph.nodeTree.responses.children

    graph.edges.push({
      id: `${graph.nodeTree.upstream.id}->${children[0].id}`,
      source: graph.nodeTree.upstream.id,
      target: children[0].id,
      type: 'seamless-smoothstep',
      markerEnd: MarkerType.ArrowClosed,
      zIndex: 2,
    })

    for (let i = 0; i < children.length - 1; i++) {
      graph.edges.push({
        id: `${children[i].id}->${children[i + 1].id}`,
        source: children[i].id,
        target: children[i + 1].id,
        type: 'smoothstep', // Using built-in edge type because handles are available on both side–we don't care about the gaps
        zIndex: 2,
      })
    }

    graph.edges.push({
      id: `${children[children.length - 1].id}->${clientNodes.in.id}`,
      source: children[children.length - 1].id,
      target: clientNodes.in.id,
      type: 'seamless-smoothstep',
      zIndex: 2,
    })
  } else {
    graph.edges.push({
      id: `${graph.nodeTree.upstream.id}->${clientNodes.in.id}`,
      source: graph.nodeTree.upstream.id,
      target: clientNodes.in.id,
      type: 'seamless-smoothstep',
      zIndex: 1,
    })
  }

  graph.edges.push({
    id: `${clientNodes.in.id}->${clientNodes.node.id}`,
    source: clientNodes.in.id,
    target: clientNodes.node.id,
    type: 'seamless-smoothstep',
    markerEnd: MarkerType.ArrowClosed,
    zIndex: 1,
  })

  return {
    ...graph,
    nodes: [
      clientNodes.node,
      clientNodes.out,
      ...graph.nodeTree.requests ? [
        graph.nodeTree.requests.node,
        ...graph.nodeTree.requests.children,
      ] : [],
      graph.nodeTree.upstream,
      ...graph.nodeTree.responses ? [
        graph.nodeTree.responses.node,
        ...graph.nodeTree.responses.children,
      ] : [],
      clientNodes.in,
    ],
  }
}

/**
 * See {@link NODE_STRIPE_COLOR_MAPPING}
 */
export const getNodeStripeColor = (durationNano?: number) => {
  if (durationNano === undefined || durationNano < 0) {
    return KUI_COLOR_BACKGROUND_DISABLED
  }

  return NODE_STRIPE_COLOR_MAPPING[
    Math.min(
      NODE_STRIPE_COLOR_MAPPING.length - 1,
      Math.max(0, Math.floor(Math.log10(durationNano)) - NODE_STRIPE_COLOR_MAPPING_START_EXP),
    )
  ]
}

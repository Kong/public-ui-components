import { KUI_COLOR_BACKGROUND_DISABLED } from '@kong/design-tokens'
import { MarkerType } from '@vue-flow/core'
import { KONG_PHASES, LifecycleDefaultNodeType, NODE_FRAME_PADDING, NODE_STRIPE_COLOR_MAPPING, NODE_STRIPE_COLOR_MAPPING_START_EXP, SPAN_NAMES } from '../constants'
import type { LifecycleGraph, LifecycleDefaultNodeData, SeamlessSmoothStepEdgeType, SpanNode } from '../types'
import { compareSpanNode, getPhaseAndPlugin } from './spans'

/**
 * Traverse a plugin span tree and build the {@link LifecycleDefaultNodeData} for the plugin and accumulate
 * the duration that has been excluded from the returned result.
 *
 * Currently, nested duration of {@link SPAN_NAMES.CLIENT_HEADERS} and {@link SPAN_NAMES.READ_BODY}
 * will be excluded from the returned result.
 *
 * @param node The root node of the plugin span tree
 * @returns the node data and the duration that has been excluded
 */
const buildPluginNodeData = (node: SpanNode): [LifecycleDefaultNodeData & { id: string }, number] | undefined => {
  // Try to parse the phase and plugin name from the span name
  const pluginSpan = getPhaseAndPlugin(node.span.name)
  if (!pluginSpan || pluginSpan.suffix) {
    // 1. `undefined` indicates that the span is not a plugin span; we should skip it
    // 2. Only process the root span of the plugin phase
    return undefined
  }

  let nodeType = LifecycleDefaultNodeType.REQUEST // We will update this later
  switch (pluginSpan.phase) {
    case KONG_PHASES.CERTIFICATE:
    case KONG_PHASES.REWRITE:
    case KONG_PHASES.ACCESS:
      nodeType = LifecycleDefaultNodeType.REQUEST
      break
    case KONG_PHASES.RESPONSE:
    case KONG_PHASES.HEADER_FILTER:
    case KONG_PHASES.BODY_FILTER:
      nodeType = LifecycleDefaultNodeType.RESPONSE
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
    spans: [node], // Skip sorting because we only have one span, otherwise this should be always sorted
  }, durationExcluded]
}

export interface BuildLifecycleGraphOptions {
  idPrefix?: string
}

export const buildLifecycleGraph = (root: SpanNode, options?: BuildLifecycleGraphOptions): LifecycleGraph => {
  const nodeIdPrefix = options?.idPrefix ?? ''
  const clientOutSpans: SpanNode[] = []
  const clientInSpans: SpanNode[] = []
  const requestNodesData: (LifecycleDefaultNodeData & { id: string })[] = []
  const responseNodesData: (LifecycleDefaultNodeData & { id: string })[] = []
  const upstreamInSpans: SpanNode[] = []
  const upstreamOutSpans: SpanNode[] = []

  let pluginDurationExcluded = 0

  const queue: SpanNode[] = [...root.children]
  while (queue.length > 0) {
    const n = queue.shift()!
    switch (n.span.name) {
      case SPAN_NAMES.CLIENT_HEADERS:
      case SPAN_NAMES.READ_BODY:
        if (n.span.parentSpanId === root.span.spanId) {
          clientOutSpans.push(n)
        }
        break
      case SPAN_NAMES.FLUSH_TO_DOWNSTREAM:
        if (n.span.parentSpanId === root.span.spanId) {
          clientInSpans.push(n)
        }
        break
      case SPAN_NAMES.KONG_UPSTREAM_SELECTION:
      case SPAN_NAMES.KONG_SEND_REQUEST_TO_UPSTREAM:
        upstreamInSpans.push(n)
        break
      case SPAN_NAMES.KONG_READ_HEADERS_FROM_UPSTREAM:
      case SPAN_NAMES.KONG_READ_BODY_FROM_UPSTREAM:
        upstreamOutSpans.push(n)
        break
      default: {
        const builtData = buildPluginNodeData(n)
        if (builtData) {
          const [nodeData, durationExcluded] = builtData
          switch (nodeData.type) {
            case LifecycleDefaultNodeType.REQUEST:
              requestNodesData.push(nodeData)
              pluginDurationExcluded += durationExcluded
              break
            case LifecycleDefaultNodeType.RESPONSE:
              responseNodesData.push(nodeData)
              pluginDurationExcluded += durationExcluded
              break
            default:
              throw new Error('unreachable')
          }
        } else {
          queue.push(...n.children)
        }
      }
    }
  }

  const sortPluginNodes = (a: LifecycleDefaultNodeData, b: LifecycleDefaultNodeData) => {
    const spanA = a.spans?.[0]
    const spanB = b.spans?.[0]
    if (spanA && spanB) {
      return compareSpanNode(spanA, spanB)
    }
    if (spanA) {
      return -1
    }
    return 1
  }

  requestNodesData.sort(sortPluginNodes)
  responseNodesData.sort(sortPluginNodes)

  const graph: Omit<LifecycleGraph, 'nodes'> = {
    nodeTree: {
      client: {
        node: {
          id: `${nodeIdPrefix}${LifecycleDefaultNodeType.CLIENT}`,
          position: { x: 0, y: 0 },
          data: {
            labelKey: 'lifecycle.client.label',
            type: LifecycleDefaultNodeType.CLIENT,
          },
          zIndex: 2,
        },
        ...clientOutSpans.length > 0 && {
          out:  {
            id: `${nodeIdPrefix}${LifecycleDefaultNodeType.CLIENT_OUT}`,
            position: { x: 0, y: 0 },
            data: {
              type: LifecycleDefaultNodeType.CLIENT_OUT,
              durationNano: clientOutSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0),
              durationTooltipKey: 'lifecycle.client_out.tooltip',
            },
            zIndex: 10, // Because we may want to show tooltips on this node
          },
        },
        ...clientInSpans.length > 0 && {
          in: {
            id: `${nodeIdPrefix}${LifecycleDefaultNodeType.CLIENT_IN}`,
            position: { x: 0, y: 0 },
            data: {
              type: LifecycleDefaultNodeType.CLIENT_IN,
              durationNano: clientInSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0) + pluginDurationExcluded,
              durationTooltipKey: 'lifecycle.client_in.tooltip',
            },
            zIndex: 10, // Because we may want to show tooltips on this node
          },
        },
      },
      requests: {
        node: {
          id: `${nodeIdPrefix}${LifecycleDefaultNodeType.REQUEST_GROUP}`,
          position: { x: 0, y: 0 },
          data: {
            labelKey: 'lifecycle.request.label',
            type: LifecycleDefaultNodeType.REQUEST_GROUP,
            emptyGroup: requestNodesData.length === 0,
            emptyGroupMessageKey: 'lifecycle.no_plugins_executed',
          },
          zIndex: 1,
        },
        children: requestNodesData.map((nodeData) => ({
          id: `${nodeIdPrefix}${LifecycleDefaultNodeType.REQUEST}:${nodeData.id}`,
          position: { x: 0, y: 0 },
          parentNode: `${nodeIdPrefix}${LifecycleDefaultNodeType.REQUEST_GROUP}`,
          data: nodeData,
          zIndex: 1,
        })),
      },
      ...(upstreamInSpans.length > 0 || upstreamOutSpans.length > 0) && {
        upstream: {
          node: {
            id: `${nodeIdPrefix}${LifecycleDefaultNodeType.UPSTREAM}`,
            position: { x: 0, y: 0 },
            data: {
              labelKey: 'lifecycle.upstream.label',
              type: LifecycleDefaultNodeType.UPSTREAM,
            },
            zIndex: 1,
          },
          ...upstreamInSpans.length > 0 && {
            in: {
              id: `${nodeIdPrefix}${LifecycleDefaultNodeType.UPSTREAM_IN}`,
              position: { x: 0, y: 0 },
              data: {
                type: LifecycleDefaultNodeType.UPSTREAM_IN,
                durationNano: upstreamInSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0),
                durationTooltipKey: 'lifecycle.upstream_in.tooltip',
              },
              zIndex: 10, // Because we may want to show tooltips on this node
            },
          },
          ...upstreamOutSpans.length > 0 && {
            out: {
              id: `${nodeIdPrefix}${LifecycleDefaultNodeType.UPSTREAM_OUT}`,
              position: { x: 0, y: 0 },
              data: {
                type: LifecycleDefaultNodeType.UPSTREAM_OUT,
                durationNano: upstreamOutSpans.reduce((duration, span) => duration + (span.durationNano ?? 0), 0),
                durationTooltipKey: 'lifecycle.upstream_out.tooltip',
              },
              zIndex: 10, // Because we may want to show tooltips on this node
            },
          },
        },
      },
      responses: {
        node: {
          id: `${nodeIdPrefix}${LifecycleDefaultNodeType.RESPONSE_GROUP}`,
          position: { x: 0, y: 0 },
          data: {
            labelKey: 'lifecycle.response.label',
            type: LifecycleDefaultNodeType.RESPONSE_GROUP,
            emptyGroup: responseNodesData.length === 0,
            emptyGroupMessageKey: 'lifecycle.no_plugins_executed',
          },
          zIndex: 1,
        },
        children: responseNodesData.map((nodeData) => ({
          id: `${nodeIdPrefix}${LifecycleDefaultNodeType.RESPONSE}:${nodeData.id}`,
          position: { x: 0, y: 0 },
          parentNode: `${nodeIdPrefix}${LifecycleDefaultNodeType.RESPONSE_GROUP}`,
          data: nodeData,
          zIndex: 1,
        })),
      },
      frame: {
        id: `${nodeIdPrefix}frame`,
        type: 'frame',
        position: { x: 0, y: 0 },
      },
    },
    edges: [],
  }

  let previousNode = graph.nodeTree.client.node

  if (graph.nodeTree.client.out) {
    graph.edges.push({
      id: `${previousNode.id}->${graph.nodeTree.client.out.id}`,
      source: previousNode.id,
      target: graph.nodeTree.client.out.id,
      type: 'seamless-smoothstep',
      zIndex: 1,
    })
    previousNode = graph.nodeTree.client.out
  }

  if (graph.nodeTree.requests) {
    const children = graph.nodeTree.requests.children

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
      id: `${previousNode.id}->${graph.nodeTree.requests.node.id}`,
      source: previousNode.id,
      target: graph.nodeTree.requests.node.id,
      type: 'seamless-smoothstep',
      zIndex: 0,
    })
    previousNode = graph.nodeTree.requests.node
  }

  if (graph.nodeTree.upstream) {
    if (graph.nodeTree.upstream.in) {
      graph.edges.push({
        id: `${previousNode.id}->${graph.nodeTree.upstream.in.id}`,
        source: previousNode.id,
        target: graph.nodeTree.upstream.in.id,
        type: 'seamless-smoothstep',
        zIndex: 0,
      })
      previousNode = graph.nodeTree.upstream.in
    }

    if (graph.nodeTree.upstream.node) {
      graph.edges.push({
        id: `${previousNode.id}->${graph.nodeTree.upstream.node.id}`,
        source: previousNode.id,
        target: graph.nodeTree.upstream.node.id,
        type: 'seamless-smoothstep',
        markerEnd: MarkerType.ArrowClosed,
        zIndex: 0,
      })
      previousNode = graph.nodeTree.upstream.node
    }

    if (graph.nodeTree.upstream.out) {
      graph.edges.push({
        id: `${previousNode.id}->${graph.nodeTree.upstream.out.id}`,
        source: previousNode.id,
        target: graph.nodeTree.upstream.out.id,
        type: 'seamless-smoothstep',
        zIndex: 0,
      })
      previousNode = graph.nodeTree.upstream.out
    }
  }

  if (graph.nodeTree.responses) {
    const children = graph.nodeTree.responses.children

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
      id: `${previousNode.id}->${graph.nodeTree.responses.node.id}`,
      source: previousNode.id,
      target: graph.nodeTree.responses.node.id,
      type: 'seamless-smoothstep',
      zIndex: 0,
      pathOptions: {
        offset: NODE_FRAME_PADDING * 2, // To avoid the edge being too close to the frame
      },
    } as SeamlessSmoothStepEdgeType)
    previousNode = graph.nodeTree.responses.node
  }

  if (graph.nodeTree.client.in) {
    graph.edges.push({
      id: `${previousNode.id}->${graph.nodeTree.client.in.id}`,
      source: previousNode.id,
      target: graph.nodeTree.client.in.id,
      type: 'seamless-smoothstep',
      zIndex: 0,
    })
    previousNode = graph.nodeTree.client.in
  }

  graph.edges.push({
    id: `${previousNode.id}->${graph.nodeTree.client.node.id}`,
    source: previousNode.id,
    target: graph.nodeTree.client.node.id,
    type: 'seamless-smoothstep',
    markerEnd: MarkerType.ArrowClosed,
    zIndex: 0,
  })

  return {
    ...graph,
    nodes: [
      graph.nodeTree.client.node,
      ...graph.nodeTree.client.out ? [graph.nodeTree.client.out] : [],
      ...graph.nodeTree.requests ? [
        graph.nodeTree.requests.node,
        ...graph.nodeTree.requests.children,
      ] : [],
      ...graph.nodeTree.upstream ? [
        ...graph.nodeTree.upstream.in ? [graph.nodeTree.upstream.in] : [],
        graph.nodeTree.upstream.node,
        ...graph.nodeTree.upstream.out ? [graph.nodeTree.upstream.out] : [],
      ] : [],
      ...graph.nodeTree.responses ? [
        graph.nodeTree.responses.node,
        ...graph.nodeTree.responses.children,
      ] : [],
      ...graph.nodeTree.client.in ? [graph.nodeTree.client.in] : [],
      graph.nodeTree.frame,
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

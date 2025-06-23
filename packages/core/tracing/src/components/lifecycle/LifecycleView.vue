<template>
  <div class="lifecycle-view">
    <KSkeleton
      v-if="showSkeleton"
      type="spinner"
    />
    <VueFlow
      v-else
      ref="flow"
      :elevate-edges-on-select="false"
      :elevate-nodes-on-select="false"
      :nodes-connectable="false"
      :nodes-draggable="false"
    >
      <template #node-default="nodeProps: NodeProps<LifecycleDefaultNodeData>">
        <LifecycleDefaultNodeView
          :data="nodeProps.data"
          :source-position="nodeProps.sourcePosition"
          :target-position="nodeProps.targetPosition"
        />
      </template>

      <template #edge-seamless-smoothstep="edgeProps: SmoothStepEdgeProps & Pick<EdgeProps<LifecycleEdgeData>, 'data'>">
        <LifecycleEdgeSeamlessSmoothstep v-bind="edgeProps" />
      </template>

      <template #node-frame>
        <div class="lifecycle-frame-node-label">
          <KongIcon :color="KUI_COLOR_TEXT_NEUTRAL_WEAK" />
          <div class="text">
            Kong
          </div>
        </div>
      </template>

      <LifecycleLegend
        ref="legend"
        :root-span="rootSpan"
      />

      <Controls
        ref="controls"
        :show-interactive="false"
        @fit-view="fitFlow"
      />
      <Background />
    </VueFlow>
  </div>
</template>

<script lang="ts" setup>
import { KUI_COLOR_TEXT_NEUTRAL_WEAK } from '@kong/design-tokens'
import { KongIcon } from '@kong/icons'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  Position,
  useVueFlow,
  VueFlow,
  type EdgeProps,
  type FitViewParams,
  type GraphNode,
  type NodeProps,
  type SmoothStepEdgeProps,
} from '@vue-flow/core'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  CANVAS_COLUMN_GAP,
  CANVAS_PADDING,
  CANVAS_ROW_GAP,
  LifecycleDefaultNodeType,
  NODE_FRAME_PADDING,
  NODE_GROUP_COLUMN_GAP,
  NODE_GROUP_PADDING,
  NODE_GROUP_ROW_GAP,
  TOOLBAR_MARGIN,
} from '../../constants'
import type { LifecycleGraph, LifecycleNode, LifecycleNodeData, LifecycleNodeType } from '../../types'
import { type LifecycleDefaultNodeData, type LifecycleEdgeData, type SpanNode } from '../../types'
import { buildLifecycleGraph } from '../../utils'
import LifecycleDefaultNodeView from './LifecycleDefaultNodeView.vue'
import LifecycleEdgeSeamlessSmoothstep from './LifecycleEdgeSeamlessSmoothstep.vue'
import LifecycleLegend from './LifecycleLegend.vue'


const props = defineProps<{
  rootSpan: SpanNode
  showSkeleton?: boolean
}>()

const flowRef = useTemplateRef<InstanceType<typeof VueFlow>>('flow')
const controlsRef = useTemplateRef<InstanceType<typeof Controls>>('controls')
const legendRef = useTemplateRef<InstanceType<typeof LifecycleLegend>>('legend')

const {
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  updateNode,
  onNodesInitialized,
} = useVueFlow()

const { findNode, fitView } = useVueFlow()

const fitViewParams = ref<FitViewParams>({
  maxZoom: 1,
})

/**
 * This function takes a list of nodes, computes the positions, and updated the nodes in-place.
 * @param nodes
 */
const layout = (nodes: LifecycleNode[]): LifecycleNode[] => {
  if (nodes.length === 0) {
    return []
  }

  let clientNode: GraphNode | undefined
  let clientOutNode: GraphNode | undefined
  let requestGroupNode: GraphNode | undefined
  let upstreamInNode: GraphNode | undefined
  let upstreamNode: GraphNode | undefined
  let upstreamOutNode: GraphNode | undefined
  let responseGroupNode: GraphNode | undefined
  let clientInNode: GraphNode | undefined

  let frameNode: GraphNode | undefined

  const requestNodes: GraphNode[] = []
  const requestGroupMetrics = {
    innerWidth: 0,
    innerHeight: 0,
    innerOffsetY: 0,
    width: 0,
    height: 0,
  }

  const responseNodes: GraphNode[] = []
  const responseGroupMetrics = {
    innerWidth: 0,
    innerHeight: 0,
    innerOffsetY: 0,
    width: 0,
    height: 0,
  }

  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id
    const node = findNode<LifecycleNodeData, any>(id) as GraphNode<LifecycleNodeData, any, LifecycleNodeType>
    if (!node) {
      throw new Error(`Graph node with ID "${id}" at index ${i} is not found`)
    }

    switch (node.type) {
      case 'default': {
        const data = node.data as LifecycleDefaultNodeData
        switch (data.type) {
          case LifecycleDefaultNodeType.CLIENT:
            node.targetPosition = Position.Bottom
            node.sourcePosition = Position.Top

            clientNode = node
            break
          case LifecycleDefaultNodeType.CLIENT_OUT:
            node.targetPosition = Position.Left
            node.sourcePosition = Position.Right

            clientOutNode = node
            break
          case LifecycleDefaultNodeType.REQUEST_GROUP:
            node.targetPosition = Position.Left
            node.sourcePosition = Position.Right

            requestGroupNode = node
            break
          case LifecycleDefaultNodeType.REQUEST:
            node.targetPosition = Position.Left
            node.sourcePosition = Position.Right

            requestNodes.push(node)
            requestGroupMetrics.innerWidth += node.dimensions.width + (requestGroupMetrics.innerWidth > 0 ? NODE_GROUP_COLUMN_GAP : 0)
            if (node.dimensions.height > requestGroupMetrics.innerHeight) {
              requestGroupMetrics.innerHeight = node.dimensions.height
            }
            break
          case LifecycleDefaultNodeType.UPSTREAM_IN:
            node.targetPosition = Position.Left
            node.sourcePosition = Position.Right

            upstreamInNode = node
            break
          case LifecycleDefaultNodeType.UPSTREAM:
            node.targetPosition = Position.Top
            node.sourcePosition = Position.Bottom

            upstreamNode = node
            break
          case LifecycleDefaultNodeType.UPSTREAM_OUT:
            node.targetPosition = Position.Right
            node.sourcePosition = Position.Left

            upstreamOutNode = node
            break
          case LifecycleDefaultNodeType.RESPONSE_GROUP:
            node.targetPosition = Position.Right
            node.sourcePosition = Position.Left

            responseGroupNode = node
            break
          case LifecycleDefaultNodeType.RESPONSE:
            node.targetPosition = Position.Right
            node.sourcePosition = Position.Left

            responseNodes.push(node)
            responseGroupMetrics.innerWidth += node.dimensions.width + (responseGroupMetrics.innerWidth > 0 ? NODE_GROUP_COLUMN_GAP : 0)
            if (node.dimensions.height > responseGroupMetrics.innerHeight) {
              responseGroupMetrics.innerHeight = node.dimensions.height
            }
            break
          case LifecycleDefaultNodeType.CLIENT_IN:
            node.targetPosition = Position.Right
            node.sourcePosition = Position.Left

            clientInNode = node
            break
          default:
            throw new Error(`Unknown node data with type "${node.data.type}" in node with type "${node.type}" at index ${i}`)
        }
        break
      }
      case 'frame':
        node.targetPosition = Position.Left
        node.sourcePosition = Position.Right
        node.position = { x: 0, y: 0 }
        frameNode = node
        break
      default:
        throw new Error(`Unknown node with type "${node.data.type}" at index ${i}`)
    }
  }

  if (!clientNode) {
    throw new Error('Missing the client node')
  } else if (!frameNode) {
    throw new Error('Missing the frame node')
  }

  // >>> Layout - Request Group
  if (requestGroupNode) {
    requestGroupMetrics.innerOffsetY = requestGroupNode.dimensions.height - NODE_GROUP_PADDING + NODE_GROUP_ROW_GAP
    requestGroupMetrics.width = Math.max(requestGroupNode.dimensions.width, requestGroupMetrics.innerWidth + NODE_GROUP_PADDING * 2)
    requestGroupMetrics.height = requestGroupNode.dimensions.height + NODE_GROUP_ROW_GAP + requestGroupMetrics.innerHeight
    requestGroupNode.width = requestGroupMetrics.width
    requestGroupNode.height = requestGroupMetrics.height

    let scopedX = NODE_GROUP_PADDING
    for (let i = 0; i < requestNodes.length; i++) {
      const node = requestNodes[i]
      if (i > 0) {
        scopedX += NODE_GROUP_COLUMN_GAP
      }
      node.position.x = scopedX
      node.position.y = requestGroupMetrics.innerOffsetY + (requestGroupMetrics.innerHeight - node.dimensions.height) / 2
      scopedX += node.dimensions.width
    }
  }
  // <<< Layout - Request Group

  // >>> Layout - Response Group
  if (responseGroupNode) {
    responseGroupMetrics.innerOffsetY = responseGroupNode.dimensions.height - NODE_GROUP_PADDING + NODE_GROUP_ROW_GAP
    responseGroupMetrics.width = Math.max(responseGroupNode.dimensions.width, responseGroupMetrics.innerWidth + NODE_GROUP_PADDING * 2)
    responseGroupMetrics.height = responseGroupNode.dimensions.height + NODE_GROUP_ROW_GAP + responseGroupMetrics.innerHeight
    responseGroupNode.width = responseGroupMetrics.width
    responseGroupNode.height = responseGroupMetrics.height

    let localX = responseGroupMetrics.width - NODE_GROUP_PADDING
    for (let i = 0; i < responseNodes.length; i++) {
      const node = responseNodes[i]
      if (i > 0) {
        localX -= NODE_GROUP_COLUMN_GAP
      }
      localX -= node.dimensions.width
      node.position.x = localX
      node.position.y = responseGroupMetrics.innerOffsetY + (responseGroupMetrics.innerHeight - node.dimensions.height) / 2
    }
  }
  // <<< Layout - Response Group

  // >>> Layout along X-axis
  let canvasX = CANVAS_PADDING

  // Client
  clientNode.position.x = canvasX
  canvasX += clientNode.dimensions.width + CANVAS_COLUMN_GAP

  // Client In / Client Out (They are horizontally center-aligned)
  const clientInOutMaxWidth = Math.max(clientOutNode?.dimensions.width ?? 0, clientInNode?.dimensions.width ?? 0)
  if (clientOutNode) {
    // Right-align
    clientOutNode.position.x = canvasX + clientInOutMaxWidth - clientOutNode.dimensions.width
  }
  if (clientInNode) {
    // Right-align
    clientInNode.position.x = canvasX + clientInOutMaxWidth - clientInNode.dimensions.width
  }
  canvasX += clientInOutMaxWidth + NODE_FRAME_PADDING * 2

  // Request Group / Response Group (They are horizontally center-aligned)
  const requestsResponsesMaxWidth = Math.max(requestGroupMetrics.width, responseGroupMetrics.width)
  if (requestGroupNode) {
    requestGroupNode.position.x = canvasX
    requestGroupNode.width = requestsResponsesMaxWidth
  }
  if (responseGroupNode) {
    responseGroupNode.position.x = canvasX
    responseGroupNode.width = requestsResponsesMaxWidth
  }
  canvasX += requestsResponsesMaxWidth + NODE_FRAME_PADDING * 2

  const upstreamInOutMaxWidth = Math.max(upstreamInNode?.dimensions.width ?? 0, upstreamOutNode?.dimensions.width ?? 0)
  if (upstreamInNode) {
    // Left-align
    upstreamInNode.position.x = canvasX
  }
  if (upstreamOutNode) {
    // Left-align
    upstreamOutNode.position.x = canvasX
  }
  canvasX += upstreamInOutMaxWidth + CANVAS_COLUMN_GAP

  // Upstream
  if (upstreamNode) {
    upstreamNode.position.x = canvasX
  }
  // <<< Layout along X-axis

  // >>> Layout along Y-axis
  let layoutY = CANVAS_PADDING

  // Client Out / Request Group / Upstream In (They are vertically center-aligned)
  const upperInnerMaxHeight = Math.max(clientOutNode?.dimensions.height ?? 0, requestGroupMetrics.height, upstreamInNode?.dimensions.height ?? 0)
  if (clientOutNode) {
    clientOutNode.position.y = layoutY + (upperInnerMaxHeight - clientOutNode.dimensions.height) / 2
  }
  if (requestGroupNode) {
    requestGroupNode.position.y = layoutY + (upperInnerMaxHeight - requestGroupMetrics.height) / 2
  }
  if (upstreamInNode) {
    upstreamInNode.position.y = layoutY + (upperInnerMaxHeight - upstreamInNode.dimensions.height) / 2
  }
  layoutY = Math.max(
    layoutY,
    clientOutNode ? (clientOutNode.position.y + clientOutNode.dimensions.height) : 0,
    requestGroupNode ? requestGroupNode.position.y + requestGroupMetrics.height : 0,
    (upstreamInNode?.position.y ?? 0) + (upstreamInNode?.dimensions.height ?? 0),
  ) + CANVAS_ROW_GAP

  // Client / Upstream (They are vertically center-aligned)
  const clientUpstreamMaxHeight = Math.max(clientNode.dimensions.height, upstreamNode?.dimensions.height ?? 0)
  clientNode.position.y = layoutY + (clientUpstreamMaxHeight - clientNode.dimensions.height) / 2
  if (upstreamNode) {
    upstreamNode.position.y = layoutY + (clientUpstreamMaxHeight - upstreamNode.dimensions.height) / 2
  }
  layoutY += clientUpstreamMaxHeight + CANVAS_ROW_GAP

  // Client In / Response Group / Upstream Out (They are vertically center-aligned)
  const lowerInnerMaxHeight = Math.max(clientInNode?.dimensions.height ?? 0, responseGroupMetrics.height, upstreamOutNode?.dimensions.height ?? 0)
  if (clientInNode) {
    clientInNode.position.y = layoutY + (lowerInnerMaxHeight - clientInNode.dimensions.height) / 2
  }
  if (responseGroupNode) {
    responseGroupNode.position.y = layoutY + (lowerInnerMaxHeight - responseGroupMetrics.height) / 2
  }
  if (upstreamOutNode) {
    upstreamOutNode.position.y = layoutY + (lowerInnerMaxHeight - upstreamOutNode.dimensions.height) / 2
  }
  // <<< Layout along Y-axis

  // >>> Layout - Frame
  const requestResponseGroupBottomY = Math.max((requestGroupNode?.position.y ?? 0) + requestGroupMetrics.height, (responseGroupNode?.position.y ?? 0) + responseGroupMetrics.height)
  const frameHeight = frameNode.dimensions.height + requestResponseGroupBottomY - Math.min(requestGroupNode?.position.y ?? 0, responseGroupNode?.position.y ?? 0)

  frameNode.width = Math.max(requestGroupMetrics.width, responseGroupMetrics.width) + NODE_FRAME_PADDING * 2
  frameNode.height = frameHeight
  frameNode.position.x = Math.min(requestGroupNode?.position.x ?? 0, responseGroupNode?.position.x ?? 0) - NODE_FRAME_PADDING
  frameNode.position.y = requestResponseGroupBottomY + NODE_FRAME_PADDING - frameHeight

  return nodes
}

const currentGraph = ref<LifecycleGraph | undefined>()
const graphCounter = ref(0)

watch(() => props.rootSpan, (rootSpan) => {
  const graph = buildLifecycleGraph(rootSpan, { idPrefix: `${graphCounter.value}#` })
  graphCounter.value = graphCounter.value >= Number.MAX_SAFE_INTEGER ? 0 : graphCounter.value + 1
  currentGraph.value = graph
}, { immediate: true })

watch(currentGraph, (newGraph, oldGraph) => {
  removeNodes(oldGraph?.nodes ?? [])
  removeEdges(oldGraph?.edges ?? [])

  addNodes(newGraph?.nodes ?? [])
  addEdges(newGraph?.edges ?? [])
}, { immediate: true })

/**
 * To fit the flow chart into the view, taking the toolbar and legend into account.
 */
const fitFlow = () => {
  const flowEl = flowRef.value?.$el
  if (!flowEl) {
    return
  }

  const controlsEl = controlsRef.value?.$el
  const legendEl = legendRef.value?.$el

  const flowWidth = flowEl.getBoundingClientRect().width
  const flowHeight = flowEl.getBoundingClientRect().height

  let accumulatedPadding = 0
  let accumulatedOffsetX = 0

  // Best effort–it's okay to miss this measurement
  if (controlsEl instanceof HTMLElement) {
    accumulatedPadding += controlsEl.getBoundingClientRect().width + TOOLBAR_MARGIN * 2
    accumulatedOffsetX -= controlsEl.getBoundingClientRect().width
  }

  // Best effort–it's okay to miss this measurement
  if (legendEl instanceof HTMLElement) {
    accumulatedPadding += legendEl.getBoundingClientRect().width + TOOLBAR_MARGIN * 2
    accumulatedOffsetX += legendEl.getBoundingClientRect().width
  }

  fitViewParams.value = {
    maxZoom: 1,
    ...flowWidth > 0 && {
      padding: accumulatedPadding / 2 / Math.min(flowWidth, flowHeight),
    }, // Use default value otherwise
    ...accumulatedOffsetX !== 0 && {
      offset: {
        x: -accumulatedOffsetX / 2,
      },
    }, // Use default value otherwise
  }

  fitView(fitViewParams.value)
}

onNodesInitialized((nodes) => {
  for (const diff of layout(nodes as LifecycleNode[])) {
    updateNode(diff.id, diff)
  }
  nextTick(() => {
    fitFlow()
  })
})

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    fitFlow()
  })
})

const replaceResizeObserver = (maybeElement: any, onCleanup: (cb: () => void) => void) => {
  if (maybeElement instanceof HTMLElement) {
    resizeObserver?.observe(maybeElement)
    onCleanup(() => {
      resizeObserver?.unobserve(maybeElement)
    })
  }
}

watch(flowRef, (newRef, _, cleanup) => {
  replaceResizeObserver(newRef?.$el, cleanup)
}, { immediate: true })

watch(controlsRef, (newRef, _, cleanup) => {
  replaceResizeObserver(newRef?.$el, cleanup)
}, { immediate: true })

watch(legendRef, (newRef, _, cleanup) => {
  replaceResizeObserver(newRef?.$el, cleanup)
}, { immediate: true })

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = undefined
  }
})
</script>

<style lang="scss">
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>

<style lang="scss" scoped>
.lifecycle-view {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;

  .k-skeleton {
    width: auto;
  }

  :deep(.vue-flow__node) {
    background-color: transparent !important;
    border: none !important;
    border-radius: $kui-border-radius-30 !important;
    padding: 0;
    width: auto;
    word-wrap: break-word;
  }

  :deep(.vue-flow__controls) {
    margin: v-bind('`${TOOLBAR_MARGIN}px`') !important;
  }

  :deep(.vue-flow__edge-path) {
    /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
    stroke: $kui-color-background-neutral !important;
  }

  :deep(.vue-flow__arrowhead) {
    polyline {
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      fill: $kui-color-background-neutral !important;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      stroke: $kui-color-background-neutral !important;
    }
  }

  :deep(.vue-flow__node-frame) {
    background-color: $kui-color-background !important;
    border: 1px solid $kui-color-border !important;
    border-radius: $kui-border-radius-30 !important;
    padding: v-bind('`${NODE_FRAME_PADDING}px`');
    width: auto;
    word-wrap: break-word;

    .lifecycle-frame-node-label {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      margin-bottom: v-bind('`${NODE_FRAME_PADDING}px`');

      .text {
        color: $kui-color-text-neutral-strongest;
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-semibold;
      }
    }
  }
}
</style>

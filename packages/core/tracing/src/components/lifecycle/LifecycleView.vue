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
      <template #node-default="nodeProps: NodeProps<LifecycleNodeData>">
        <LifecycleViewNode
          :data="nodeProps.data"
          :source-position="nodeProps.sourcePosition"
          :target-position="nodeProps.targetPosition"
        />
      </template>

      <template #edge-seamless-smoothstep="edgeProps: SmoothStepEdgeProps & Pick<EdgeProps<LifecycleEdgeData>, 'data'>">
        <LifecycleEdgeSeamlessSmoothstep v-bind="edgeProps" />
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
      <Background variant="lines" />
    </VueFlow>
  </div>
</template>

<script lang="ts" setup>
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  CANVAS_COLUMN_GAP,
  CANVAS_PADDING,
  CANVAS_ROW_GAP,
  LifecycleNodeType,
  NODE_GROUP_COLUMN_GAP,
  NODE_GROUP_PADDING,
  NODE_GROUP_ROW_GAP,
  TOOLBAR_MARGIN,
} from '../../constants'
import { type LifecycleEdgeData, type LifecycleNode, type LifecycleNodeData, type SpanNode } from '../../types'
import { buildLifecycleGraph } from '../../utils'
import LifecycleEdgeSeamlessSmoothstep from './LifecycleEdgeSeamlessSmoothstep.vue'
import LifecycleLegend from './LifecycleLegend.vue'
import LifecycleViewNode from './LifecycleViewNode.vue'

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
  let upstreamNode: GraphNode | undefined
  let responseGroupNode: GraphNode | undefined
  let clientInNode: GraphNode | undefined

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
    const node = findNode<LifecycleNodeData, any>(id)
    if (!node) {
      throw new Error(`Graph node with ID "${id}" at index ${i} is not found`)
    }

    switch (node.data.type) {
      case LifecycleNodeType.CLIENT:
        node.targetPosition = Position.Bottom
        node.sourcePosition = Position.Top

        clientNode = node
        break
      case LifecycleNodeType.CLIENT_OUT:
        node.targetPosition = Position.Left
        node.sourcePosition = Position.Right

        clientOutNode = node
        break
      case LifecycleNodeType.REQUEST_GROUP:
        node.targetPosition = Position.Left
        node.sourcePosition = Position.Right

        requestGroupNode = node
        break
      case LifecycleNodeType.REQUEST:
        node.targetPosition = Position.Left
        node.sourcePosition = Position.Right

        requestNodes.push(node)
        requestGroupMetrics.innerWidth += node.dimensions.width + (requestGroupMetrics.innerWidth > 0 ? NODE_GROUP_COLUMN_GAP : 0)
        if (node.dimensions.height > requestGroupMetrics.innerHeight) {
          requestGroupMetrics.innerHeight = node.dimensions.height
        }
        break
      case LifecycleNodeType.UPSTREAM:
        node.targetPosition = Position.Top
        node.sourcePosition = Position.Bottom

        upstreamNode = node
        break
      case LifecycleNodeType.RESPONSE_GROUP:
        node.targetPosition = Position.Right
        node.sourcePosition = Position.Left

        responseGroupNode = node
        break
      case LifecycleNodeType.RESPONSE:
        node.targetPosition = Position.Right
        node.sourcePosition = Position.Left

        responseNodes.push(node)
        responseGroupMetrics.innerWidth += node.dimensions.width + (responseGroupMetrics.innerWidth > 0 ? NODE_GROUP_COLUMN_GAP : 0)
        if (node.dimensions.height > responseGroupMetrics.innerHeight) {
          responseGroupMetrics.innerHeight = node.dimensions.height
        }
        break
      case LifecycleNodeType.CLIENT_IN:
        node.targetPosition = Position.Right
        node.sourcePosition = Position.Left

        clientInNode = node
        break
      default:
        throw new Error(`Unknown node type: "${node.data.type}" at index ${i}`)
    }
  }

  if (!clientNode) {
    throw new Error('Missing the client node')
  } else if (!clientOutNode) {
    throw new Error('Missing the client out node')
  } else if (!upstreamNode) {
    throw new Error('Missing the upstream node')
  } else if (!clientInNode) {
    throw new Error('Missing the client in node')
  }

  // >>> Layout - Request Group
  if (requestGroupNode) {
    requestGroupMetrics.innerOffsetY = requestGroupNode.dimensions.height - NODE_GROUP_PADDING + NODE_GROUP_ROW_GAP
    requestGroupMetrics.width = requestGroupMetrics.innerWidth + NODE_GROUP_PADDING * 2
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
    responseGroupMetrics.innerOffsetY = NODE_GROUP_PADDING
    responseGroupMetrics.width = responseGroupMetrics.innerWidth + NODE_GROUP_PADDING * 2
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
      node.position.y = NODE_GROUP_PADDING + (responseGroupMetrics.innerHeight - node.dimensions.height) / 2
    }
  }
  // <<< Layout - Response Group

  // >>> Layout along X-axis
  let canvasX = CANVAS_PADDING

  // Client
  clientNode.position.x = canvasX
  canvasX += clientNode.dimensions.width + CANVAS_COLUMN_GAP

  // Client In / Client Out (They are horizontally center-aligned)
  const clientInOutMaxWidth = Math.max(clientOutNode.dimensions.width, clientInNode.dimensions.width)
  clientOutNode.position.x = canvasX + (clientInOutMaxWidth - clientOutNode.dimensions.width) / 2
  clientInNode.position.x = canvasX + (clientInOutMaxWidth - clientInNode.dimensions.width) / 2
  canvasX += clientInOutMaxWidth + CANVAS_COLUMN_GAP

  // Request Group / Response Group (They are horizontally center-aligned)
  const requestsResponsesMaxWidth = Math.max(requestGroupMetrics.width, responseGroupMetrics.width)
  if (requestGroupNode) {
    requestGroupNode.position.x = canvasX + (requestsResponsesMaxWidth - requestGroupMetrics.width) / 2
  }
  if (responseGroupNode) {
    responseGroupNode.position.x = canvasX + (requestsResponsesMaxWidth - responseGroupMetrics.width) / 2
  }
  canvasX += requestsResponsesMaxWidth + CANVAS_COLUMN_GAP

  // Upstream
  upstreamNode.position.x = canvasX
  // <<< Layout along X-axis

  // >>> Layout along Y-axis
  let layoutY = CANVAS_PADDING

  // Client Out / Request Group (They are vertically center-aligned)
  const upperInnerMaxHeight = Math.max(clientOutNode.dimensions.height, requestGroupMetrics.innerHeight)
  clientOutNode.position.y = layoutY + requestGroupMetrics.innerOffsetY + (upperInnerMaxHeight - clientOutNode.dimensions.height) / 2
  if (requestGroupNode) {
    requestGroupNode.position.y = layoutY + (upperInnerMaxHeight - requestGroupMetrics.innerHeight) / 2
  }
  layoutY = Math.max(
    clientOutNode.position.y + clientOutNode.dimensions.height,
    requestGroupNode ? requestGroupNode.position.y + requestGroupMetrics.height : 0,
  ) + CANVAS_ROW_GAP

  // Client / Upstream (They are vertically center-aligned)
  const clientUpstreamMaxHeight = Math.max(clientNode.dimensions.height, upstreamNode.dimensions.height)
  clientNode.position.y = layoutY + (clientUpstreamMaxHeight - clientNode.dimensions.height) / 2
  upstreamNode.position.y = layoutY + (clientUpstreamMaxHeight - upstreamNode.dimensions.height) / 2
  layoutY += clientUpstreamMaxHeight + CANVAS_ROW_GAP

  // Client In / Response Group (They are vertically center-aligned)
  const lowerInnerMaxHeight = Math.max(clientInNode.dimensions.height, responseGroupMetrics.innerHeight)
  clientInNode.position.y = layoutY + responseGroupMetrics.innerOffsetY + (lowerInnerMaxHeight - clientInNode.dimensions.height) / 2
  if (responseGroupNode) {
    responseGroupNode.position.y = layoutY + (lowerInnerMaxHeight - responseGroupMetrics.innerHeight) / 2
  }
  // <<< Layout along Y-axis

  return nodes
}

const currentGraph = computed(() => buildLifecycleGraph(props.rootSpan))

/**
 * To fit the flow chart into the view, taking the toolbar and legend into account.
 */
const fitFlow = () => {
  const flowEl = flowRef.value?.$el
  if (!(flowEl instanceof HTMLElement)) {
    return
  }

  const controlsEl = controlsRef.value?.$el
  const legendEl = legendRef.value?.$el

  const flowWidth = flowEl.getBoundingClientRect().width
  let accumulatedPadding = 0
  let accumulatedOffsetX = 0

  // Best effort–it's okay to miss this measurement
  if (controlsEl instanceof HTMLElement) {
    accumulatedPadding += controlsEl.getBoundingClientRect().width + 2 * TOOLBAR_MARGIN
    accumulatedOffsetX = controlsEl.getBoundingClientRect().width
  }

  // Best effort–it's okay to miss this measurement
  if (legendEl instanceof HTMLElement) {
    accumulatedPadding += legendEl.getBoundingClientRect().width + 2 * TOOLBAR_MARGIN
    accumulatedOffsetX -= legendEl.getBoundingClientRect().width
  }

  fitViewParams.value = {
    maxZoom: 1,
    ...flowWidth > 0 && {
      padding: accumulatedPadding / 2 / flowWidth,
    }, // Use default value otherwise
    ...accumulatedOffsetX !== 0 && {
      offset: {
        x: accumulatedOffsetX / 2,
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

watch(
  currentGraph,
  (newGraph, oldGraph) => {
    removeNodes(oldGraph?.nodes ?? [])
    removeEdges(oldGraph?.edges ?? [])

    addNodes(newGraph?.nodes ?? [])
    addEdges(newGraph?.edges ?? [])
  },
  { immediate: true },
)

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    fitFlow()
  })
  if (flowRef.value && flowRef.value.$el instanceof HTMLElement) {
    resizeObserver.observe(flowRef.value.$el)
  }
  if (controlsRef.value && controlsRef.value.$el instanceof HTMLElement) {
    resizeObserver.observe(controlsRef.value.$el)
  }
  if (legendRef.value && legendRef.value.$el instanceof HTMLElement) {
    resizeObserver.observe(legendRef.value.$el)
  }
})

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
}
</style>

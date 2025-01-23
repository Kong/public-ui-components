<template>
  <div
    ref="root"
    class="lifecycle-view"
  >
    <KSkeleton
      v-if="showSkeleton"
      type="spinner"
    />
    <VueFlow
      v-else
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

      <div class="total-latency">
        <span>{{ t('lifecycle.total_latency') }}:</span>
        <span>{{ fmt(props.rootSpan.durationNano) }}</span>
      </div>

      <Controls
        :fit-view-params="fitViewParams"
        :show-interactive="false"
      />
      <Background />
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
  type FitViewParams,
  type GraphNode,
  type NodeProps,
} from '@vue-flow/core'
import { computed, nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import composables from '../../composables'
import { LifecycleNodeType } from '../../constants'
import { type LifecycleNode, type LifecycleNodeData, type SpanNode } from '../../types'
import { buildLifecycleGraph, getDurationFormatter } from '../../utils'
import LifecycleViewNode from './LifecycleViewNode.vue'

const fmt = getDurationFormatter()
const { i18n: { t } } = composables.useI18n()

const props = defineProps<{
  rootSpan: SpanNode
  showSkeleton?: boolean
}>()

const rootRef = useTemplateRef<HTMLDivElement>('root')

const options = {
  nodeGapX: 30,
  nodeGapY: 10,
}

const {
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  updateNode,
  onNodesInitialized,
} = useVueFlow()

const { findNode, fitView } = useVueFlow()

const fitViewParams: FitViewParams = {
  maxZoom: 1,
}

/**
 * This function takes a list of nodes, computes the positions, and updated the nodes in-place.
 * @param nodes
 */
const layout = (nodes: LifecycleNode[]): LifecycleNode[] => {
  if (nodes.length === 0) {
    return []
  }

  let clientNode: GraphNode | undefined
  let upstreamNode: GraphNode | undefined

  const requestNodes: GraphNode[] = []
  const requestBox = {
    width: 0,
    height: 0,
  }

  const responseNodes: GraphNode[] = []
  const responseBox = {
    width: 0,
    height: 0,
  }

  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id
    const node = findNode<LifecycleNodeData, any>(id)
    if (!node) {
      throw new Error(`Graph node with ID "${id}" is not found`)
    }

    switch (node.data.type) {
      case LifecycleNodeType.CLIENT:
        if (i !== 0) {
          throw new Error('The client node did not appear first')
        }

        node.targetPosition = Position.Bottom
        node.sourcePosition = Position.Top
        clientNode = node
        break
      case LifecycleNodeType.REQUEST:
        if (!clientNode) {
          throw new Error('Encountered a request node before the client node')
        } if (upstreamNode) {
          throw new Error('Encountered a request node after the upstream node')
        }

        node.targetPosition = Position.Left
        node.sourcePosition = Position.Right

        requestNodes.push(node)
        requestBox.width += node.dimensions.width + (requestBox.width > 0 ? options.nodeGapX : 0)
        if (node.dimensions.height > requestBox.height) {
          requestBox.height = node.dimensions.height
        }
        break
      case LifecycleNodeType.UPSTREAM:
        if (!clientNode) {
          throw new Error('Encountered the upstream node before the client node')
        } else if (upstreamNode) {
          throw new Error(`Duplicate upstream node at index ${i}`)
        }

        node.targetPosition = Position.Top
        node.sourcePosition = Position.Bottom

        upstreamNode = node
        break
      case LifecycleNodeType.RESPONSE:
        if (i === 0) {
          throw new Error('Encountered a response node before the client node')
        } else if (!upstreamNode) {
          throw new Error('Encountered a response node before the upstream node')
        }

        node.targetPosition = Position.Right
        node.sourcePosition = Position.Left

        responseNodes.push(node)
        responseBox.width += node.dimensions.width + (responseBox.width > 0 ? options.nodeGapX : 0)
        if (node.dimensions.height > responseBox.height) {
          responseBox.height = node.dimensions.height
        }
        break
      default:
        throw new Error(`Unknown node type: ${node.data.type}`)
    }
  }

  if (!clientNode) {
    throw new Error('Missing the client node')
  } else if (!upstreamNode) {
    throw new Error('Missing the upstream node')
  }

  // "lr" stands for "left and right": refers to the client and upstream nodes
  const lrHeight = Math.max(clientNode.dimensions.height, upstreamNode.dimensions.height)
  const lrOffsetY = Math.abs(clientNode.dimensions.height - upstreamNode.dimensions.height) / 2

  // "tb" stands for "top and bottom": refers to the request and response nodes
  const tbWidth = Math.max(requestBox.width, responseBox.width)
  const tbOffsetX = Math.abs(requestBox.width - responseBox.width) / 2

  clientNode.position.y = requestBox.height + options.nodeGapY

  let x = clientNode.position.x + clientNode.dimensions.width
  if (requestBox.width < responseBox.width) {
    x += tbOffsetX
  }
  for (const node of requestNodes) {
    x += options.nodeGapX
    node.position.x = x
    node.position.y = (requestBox.height - node.dimensions.height) / 2
    x += node.dimensions.width
  }

  upstreamNode.position.x = clientNode.position.x + clientNode.dimensions.width + options.nodeGapX + tbWidth + options.nodeGapX
  upstreamNode.position.y = requestBox.height + options.nodeGapY

  x = clientNode.position.x + clientNode.dimensions.width + options.nodeGapX + tbWidth + options.nodeGapX
  if (responseBox.width < requestBox.width) {
    x -= tbOffsetX
  }

  const bottomBaseY = requestBox.height + options.nodeGapY + lrHeight + options.nodeGapY
  for (const node of responseNodes) {
    x -= options.nodeGapX + node.dimensions.width
    node.position.x = x
    node.position.y = bottomBaseY + (responseBox.height - node.dimensions.height) / 2
  }

  if (clientNode.dimensions.height < upstreamNode.dimensions.height) {
    clientNode.position.y += lrOffsetY
  } else {
    upstreamNode.position.y += lrOffsetY
  }

  return nodes
}

const currentGraph = computed(() => buildLifecycleGraph(props.rootSpan))

onNodesInitialized((nodes) => {
  for (const diff of layout(nodes as LifecycleNode[])) {
    updateNode(diff.id, diff)
  }
  nextTick(() => {
    fitView(fitViewParams)
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
  if (rootRef.value) {
    resizeObserver = new ResizeObserver(() => {
      fitView(fitViewParams)
    })
    resizeObserver.observe(rootRef.value)
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

.lifecycle-view {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;

  .k-skeleton {
    width: auto;
  }

  .total-latency {
    align-items: center;
    background-color: $kui-color-background;
    bottom: 16px; // = $kui-space-60
    box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.08); // Hardcoding to keep consistent with VueFlow's built-in Control component's style
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    flex-shrink: 0;
    font-size: $kui-font-size-20;
    gap: $kui-space-40;
    justify-content: flex-start;
    padding: $kui-space-20 $kui-space-30;
    position: absolute;
    right: 16px; // = $kui-space-60
    z-index: 1000;
  }
}

.vue-flow__node {
  border: $kui-border-width-10 solid #000000; // Hardcoding because we don't have a corresponding token yet
  border-radius: $kui-border-radius-30;
  padding: 0;
  width: auto;
  word-wrap: break-word;
}
</style>

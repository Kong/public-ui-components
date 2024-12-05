<template>
  <div class="lifecycle-view">
    <VueFlow
      ref="flow"
      :nodes-connectable="false"
      :nodes-draggable="false"
    >
      <template #node-default="props: NodeProps<LifecycleNodeData>">
        <LifecycleViewNode
          :data="props.data"
          :source-position="props.sourcePosition"
          :target-position="props.targetPosition"
        />
      </template>

      <LifecycleViewLegend ref="legend" />

      <Controls :show-interactive="false" />
      <Background />
    </VueFlow>
  </div>
</template>

<script lang="ts" setup>
import { KUI_SPACE_40 } from '@kong/design-tokens'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import {
  getRectOfNodes,
  Position,
  useVueFlow,
  VueFlow,
  type NodeProps,
} from '@vue-flow/core'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, type ComponentInstance } from 'vue'
import { LifecycleNodeType } from '../../constants'
import { type LifecycleGraph, type LifecycleNode, type LifecycleNodeData } from '../../types'
import { buildLifecycleGraph } from '../../utils'
import LifecycleViewLegend from './LifecycleViewLegend.vue'
import LifecycleViewNode from './LifecycleViewNode.vue'

const flowRef = useTemplateRef<ComponentInstance<typeof VueFlow>>('flow')
const legendRef = useTemplateRef<ComponentInstance<typeof LifecycleViewLegend>>('legend')

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
  onNodeClick,
} = useVueFlow()

const { findNode, fitBounds } = useVueFlow()

const layout = (nodes: LifecycleNode[]): LifecycleNode[] => {
  if (nodes.length === 0) {
    return []
  }

  const output = [...nodes]

  let x = 0
  let y = 0
  let maxHeight = 0
  const heights = []
  let upstreamIndex = -1

  for (let i = 0; i < output.length; i++) {
    const prev = i > 0 ? output[i - 1] : undefined
    const curr = output[i]

    const graphNode = findNode(curr.id)
    const width = graphNode?.dimensions.width ?? 0
    const height = graphNode?.dimensions.height ?? 0
    heights.push(height)

    switch (curr.data.type) {
      case 'request':
        if (prev && prev.data.type !== 'request') {
          throw new Error(`Invalid direction mutation: ${prev?.data.type} -> ${curr.data.type}`)
        }
        x += options.nodeGapX
        curr.position = { x, y }
        curr.targetPosition = Position.Left
        curr.sourcePosition = Position.Right
        x += width
        if (height > maxHeight) {
          maxHeight = height
        }
        break
      case 'upstream':
        if (prev?.data.type !== 'request') {
          throw new Error(`Invalid direction mutation: ${prev?.data.type} -> ${curr.data.type}`)
        }

        for (let j = 0; j < i; j++) {
          const node = output[j]
          node.position = {
            x: node.position.x,
            y: maxHeight - heights[j],
          }
        }

        x += options.nodeGapX
        y += maxHeight + options.nodeGapY
        curr.position = { x, y }
        curr.targetPosition = Position.Top
        curr.sourcePosition = Position.Bottom
        y += height + options.nodeGapY
        maxHeight = 0
        upstreamIndex = i
        break
      case 'response':
        if (prev?.data.type !== 'upstream' && prev?.data.type !== 'response') {
          throw new Error(`Invalid direction mutation: ${prev?.data.type} -> ${curr.data.type}`)
        }

        x -= width + options.nodeGapX
        curr.position = { x, y }
        curr.targetPosition = Position.Right
        curr.sourcePosition = Position.Left
        if (height > maxHeight) {
          maxHeight = height
        }
        break
    }
  }

  if (upstreamIndex >= 0) {
    for (let i = upstreamIndex; i < output.length; i++) {
      const node = output[i]
      node.position = {
        x: node.position.x,
        y: node.position.y + (maxHeight - heights[i]),
      }
    }
  }

  return output
}

const currentGraph = ref<LifecycleGraph>(buildLifecycleGraph([{
  label: 'TLS Handshake',
  durationNano: 2 * 1e6,
  type: LifecycleNodeType.REQUEST,
}, {
  label: 'OIDC Plugin',
  durationNano: 1 * 1e6,
  type: LifecycleNodeType.REQUEST,
}, {
  label: 'Rate Limiting Plugin',
  durationNano: 1 * 1e6,
  type: LifecycleNodeType.REQUEST,
}, {
  label: 'DNS Resolution',
  durationNano: 2 * 1e6,
  type:LifecycleNodeType.REQUEST,
}, {
  label: 'Upstream Connection',
  durationNano: 25 * 1e6,
  type: LifecycleNodeType.UPSTREAM,
}, {
  label: 'Jq Plugin',
  durationNano: 5 * 1e6,
  type: LifecycleNodeType.RESPONSE,
}, {
  label: 'Response Transformer Plugin',
  durationNano: 1 * 1e6,
  type: LifecycleNodeType.RESPONSE,
}]))

onNodesInitialized((nodes) => {
  for (const diff of layout(nodes)) {
    updateNode(diff.id, diff)
  }
  nextTick(() => {
    fitNodes()
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

const fitNodes = () => {
  if (!flowRef.value?.nodes) {
    return
  }
  const rect = getRectOfNodes(flowRef.value.nodes)
  const legendOuterBounds = (legendRef.value?.$el.getBoundingClientRect?.()?.height ?? 0) + 2 * 8
  rect.height += legendOuterBounds
  fitBounds(rect)
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    fitNodes()
  })
  if (legendRef.value) {
    resizeObserver.observe(legendRef.value.$el)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

// onNodeClick((e: NodeMouseEvent) => {
//   const node = e.node as ExtendedNode

//   switch (node.data?.extendedType) {
//     case 'span': {
//       if (node.data?.child) {
//         currentGraph.value = node.data?.child
//       }
//       break
//     }
//     case 'parent': {
//       if (node.data.parent) {
//         currentGraph.value = node.data.parent
//       }
//       break
//     }
//   }
// })
</script>

<style lang="scss">
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/node-resizer/dist/style.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

@import '@vue-flow/core/dist/theme-default.css';

.lifecycle-view {
  height: 300px;
  width: 100%;
}

.vue-flow__node {
  border: $kui-border-width-10 solid black;
  border-radius: $kui-border-radius-30;
  box-shadow: 0 2px 4px #00000010;
  padding: 0;
  width: auto;
  word-wrap: break-word;
}
</style>

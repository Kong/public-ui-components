<template>
  <div
    ref="root"
    class="canvas-container"
  >
    <canvas
      ref="canvas"
      class="canvas"
    />
  </div>
</template>

<script setup lang="ts">
import {
  FlameChart,
  type FlameChartOptions,
  type FlatTreeNode,
} from '@kong/flame-chart-js'
import type { ExtendedFlameNode, NodeTypes } from 'src/types'
import {
  defineEmits,
  onMounted, onUnmounted, ref, watch,
} from 'vue'

const props = defineProps<{
  nodes?: ExtendedFlameNode[]
  selectedFlatTreeNode?: FlatTreeNode | null
}>()

const emit = defineEmits<{
  'select': [node: NodeTypes]
}>()

const root = ref()
const canvas = ref()

let flameChart: FlameChart
let resizeObserver: ResizeObserver

onMounted(async () => {
  resizeObserver = new ResizeObserver((result) => {
    const { inlineSize: width, blockSize: height } = result[0].contentBoxSize[0]
    flameChart.resize(width, height)
  })

  resizeObserver.observe(root.value)

  const { width = 0, height = 0 } = root.value.getBoundingClientRect()
  canvas.value.width = width
  canvas.value.height = height - 3

  flameChart = new FlameChart({
    canvas: canvas.value, // mandatory
    data: [],
    settings: {
      options: {
        nonSequential: true,
      },
      styles: {
        main: {
          font: '11px monospace',
          blockHeight: 20,
        },
        flameChartPlugin: {
          stackUpwards: true,
        },
      },
    },
  } as FlameChartOptions)

  flameChart.on('select', (t: NodeTypes) => {
    emit('select', t)
  })

  watch(() => props.nodes, (nodes) => {
    if (nodes === undefined) {
      flameChart.setNodes([])
      return
    }

    // const exportedNodes = cloneDeep(nodes)
    // const q = [...exportedNodes]
    // while (q.length > 0) {
    //   const n = q.shift()!
    //   delete n._root
    //   delete n._children
    //   delete n.selfDuration
    //   delete n.totalDuration
    //   delete n.parent
    //   for (const c of n.children || []) {
    //     q.push(c)
    //   }
    // }

    // console.log(exportedNodes)

    // console.log(JSON.stringify(exportedNodes, null, 2))

    flameChart.setNodes(nodes)
  }, { immediate: true, deep: true })
})

onUnmounted(() => {
  resizeObserver.disconnect()
})
</script>

<style lang="scss" scoped>
.canvas-container {
  height: 100%;
  width: 100%;
}
</style>

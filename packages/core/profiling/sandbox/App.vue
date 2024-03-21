<template>
  <div class="sandbox-container">
    <main>
      <FlameChart
        class="flame-chart-container"
        :nodes="nodes"
        @select="onSelectNode"
      />
      <div class="flame-node-list-container">
        <FlameNodeList :nodes="listNodes" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ExtendedFlameNode, NodeTypes } from '../src'
import { FlameChart, FlameNodeList, getLeafNodes, toExtendedFlameChartNodes } from '../src'
import { EXAMPLE_FOLDED_STACK } from './fixtures'

const nodes = computed(() => toExtendedFlameChartNodes(EXAMPLE_FOLDED_STACK.split('\n')))
const listNodes = ref<ExtendedFlameNode[]>([])

const onSelectNode = (nt: NodeTypes) => {
  if (nt !== null && nt.type === 'flame-chart-node') {

    if (nt.node?.source !== undefined) {
      listNodes.value = getLeafNodes(nt.node?.source)
    }
  }
}

</script>

<style lang="scss" scoped>
main {
  position: fixed;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
}

.flame-chart-container {
  width: 100%;
  height: 50%
}

.flame-node-list-container {
  font-size: 11px;
  width: 100%;
  height: 50%;
  overflow: scroll;
}
</style>

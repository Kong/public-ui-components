<template>
  <!-- The <div> tag here is just a placeholder for your component content. -->
  <!-- We recommend wrapping your component with a unique class when possible, as shown below. -->

  <div
    class="container-fluid"
    style="margin: 0;padding: 0"
  >
    <div class="home-flow-container">
      <VueFlow
        :edges="chartEdges"
        fit-view-on-init
        :nodes="chartNodes"
      >
        <DropzoneBackground
          :style="{
            backgroundColor: '#e7f3ff',
            transition: 'background-color 0.2s ease',
          }"
        />

        <Panel position="top-right">
          <KButton size="large">
            <AddIcon /> Add Service
          </KButton>
        </Panel>

        <Controls position="top-left" />

        <!-- bind your custom node type to a component by using slots, slot names are always `node-<type>` -->
        <template #node-special="specialNodeProps">
          <SpecialNode v-bind="specialNodeProps" />
        </template>

        <template #node-main>
          <MainNode />
        </template>

        <!-- bind your custom edge type to a component by using slots, slot names are always `edge-<type>` -->
        <template #edge-special="specialEdgeProps">
          <SpecialEdge v-bind="specialEdgeProps" />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'

import SpecialNode from './SpecialNode.vue'
import SpecialEdge from './SpecialEdge.vue'
import MainNode from './MainNode.vue'

import { AddIcon } from '@kong/icons'
import { KButton } from '@kong/kongponents'
import DropzoneBackground from './DropzoneBackground.vue'

const { onConnect, addEdges } = useVueFlow()

const chartNodes: Ref<Node[]> = ref<Node[]>([])

const chartEdges: Ref<Edge[]> = ref<Edge[]>([])

onConnect((params) => addEdges(params))
</script>

<style lang="scss">
.home-flow-container {
  border: 0.5px solid gray;
  border-radius: 8px;
  height: 700px;
  max-width: 100%;
}

.vue-flow__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center
}
</style>

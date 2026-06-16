<template>
  <div class="datakit-readonly-canvas">
    <FlowCanvas
      :flow-id="flowId"
      mode="debugger"
      :phase="phase"
      @node-click="emit('node-click', $event)"
    >
      <template #node-status="s">
        <slot
          v-bind="s"
          name="node-status"
        />
      </template>
      <template #node-latency="s">
        <slot
          v-bind="s"
          name="node-latency"
        />
      </template>
    </FlowCanvas>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

import FlowCanvas from './flow-editor/FlowCanvas.vue'
import { provideEditorStore } from './composables'

import type { DatakitPluginData, NodeInstance, NodePhase } from './types'

const { pluginData, phase } = defineProps<{
  pluginData: DatakitPluginData
  phase: NodePhase
}>()

const emit = defineEmits<{
  'node-click': [node: NodeInstance]
}>()

provideEditorStore(pluginData)

const flowId = useId()
</script>

<style lang="scss" scoped>
.datakit-readonly-canvas {
  height: 100%;
  position: relative;
  width: 100%;
}
</style>

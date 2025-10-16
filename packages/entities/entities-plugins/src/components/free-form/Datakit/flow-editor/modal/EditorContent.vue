<template>
  <div class="dk-editor-content">
    <SidePanel />

    <div class="main">
      <EditorMain />
    </div>

    <NodePropertiesPanel
      :node-id="selectedNode?.id"
      :visible="propertiesPanelOpen"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useEditorStore } from '../../composables'
import EditorMain from './EditorMain.vue'
import SidePanel from '../side-panel'
import NodePropertiesPanel from '../node/NodePropertiesPanel.vue'

const { propertiesPanelOpen, selectedNode } = useEditorStore()

function handleClose() {
  propertiesPanelOpen.value = false
}

watch(selectedNode, (node) => {
  if (!node) {
    handleClose()
  }
})

// A workaround to prevent startup transition when the side panel
// is collapsed per user preference.
const inited = ref(false)
onMounted(() => {
  inited.value = true
})
</script>

<style lang="scss" scoped>
.dk-editor-content {
  background-color: $kui-color-background;
  border-top-left-radius: $kui-border-radius-30;
  display: flex;
  overflow: hidden;
  position: relative;

  .main {
    flex: 1 1 auto;
  }
}
</style>

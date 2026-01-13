<template>
  <div
    ref="panesContainerRef"
    class="kong-ui-public-split-pane-content-panes"
    :class="{
      'horizontal': !horizontal,
      'vertical': horizontal,
      'dragging': splitPane.isDragging.value,
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, onMounted, useTemplateRef, nextTick } from 'vue'
import { SplitPaneKey, type SplitPaneContext } from '../context/splitPaneContext'
import { useSplitPane } from '../composable/useSplitPane'

const {
  horizontal = false,
  pushOtherPanes = true,
  storageKey = undefined,
} = defineProps<{
  /**
   * Horizontal layout (false = vertical split with horizontal dividers)
   */
  horizontal?: boolean
  /**
   * Whether to push other panes when dragging
   */
  pushOtherPanes?: boolean
  /**
   * Unique key for localStorage persistence of pane sizes
   */
  storageKey?: string
}>()

const panesContainerRef = useTemplateRef('panesContainerRef')

const splitPane = useSplitPane({
  horizontal,
  pushOtherPanes,
  storageKey,
})

onMounted(async () => {
  splitPane.setContainerRef(panesContainerRef.value)
  await nextTick()
  splitPane.resetPaneSizes()
})

// Provide context to child Pane components
provide<SplitPaneContext>(SplitPaneKey, {
  panes: splitPane.panes,
  indexedPanes: splitPane.indexedPanes,
  isDragging: splitPane.isDragging,
  horizontal,
  registerPane: splitPane.registerPane,
  unregisterPane: splitPane.unregisterPane,
  updatePane: splitPane.updatePane,
  startDrag: splitPane.startDrag,
  drag: splitPane.drag,
  endDrag: splitPane.endDrag,
})
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-content-panes {
  align-items: stretch;
  background-color: $kui-color-background;
  border-top-left-radius: $kui-border-radius-30;
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  overflow: hidden;
  width: 100%;
  z-index: 0;

  &.horizontal {
    flex-direction: row;
  }

  &.vertical {
    flex-direction: column;
  }
}
</style>

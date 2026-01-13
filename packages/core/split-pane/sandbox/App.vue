<template>
  <div class="sandbox-container">
    <SplitPane
      :pane-center="props.paneCenter"
      :pane-left="props.paneLeft"
      :pane-right="props.paneRight"
      :show-resize-handle="true"
    >
      <template #pane-left>
        left
      </template>
      <template #pane-center>
        centre
      </template>
      <template #pane-right>
        right
      </template>
    </SplitPane>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SplitPane, type SplitPaneProps } from '../src'

const props = computed((): SplitPaneProps => ({
  paneLeft: { visible: true },
  paneCenter: { visible: true },
  paneRight: { visible: true },
}))
</script>

<style lang="scss">
html,
body {
  background: $kui-color-background;
  margin: $kui-space-0;
  overflow: hidden;
}
</style>

<template>
  <main class="custom-container">
    <KCard class="my-card">
      <SplitPane
        :pane-center="props.paneCenter"
        :pane-left="props.paneLeft"
        :pane-right="props.paneRight"
        :show-navigation="false"
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
    </KCard>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SplitPane } from '../../src'
import type { SplitPaneProps } from '../../src'

const props = computed((): SplitPaneProps => ({
  paneLeft: { visible: true },
  paneCenter: { visible: true },
  paneRight: { visible: true },
}))
</script>

<style lang="scss" scoped>
.custom-container {
  padding: $kui-space-100;

  .my-card {
    height: 500px;
    padding: $kui-space-0;
  }
}
</style>

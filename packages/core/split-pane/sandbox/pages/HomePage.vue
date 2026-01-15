<template>
  <main class="custom-container">
    <KCard>
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
import { SplitPane, type SplitPaneProps } from '../../src'

const props = computed((): SplitPaneProps => ({
  paneLeft: { visible: true },
  paneCenter: { visible: true },
  paneRight: { visible: true },
}))
</script>

<style lang="scss" scoped>
.custom-container {
  padding: $kui-space-100;
}
</style>

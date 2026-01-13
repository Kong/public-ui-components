<template>
  <div class="kong-ui-public-split-pane-layout">
    <div class="kong-ui-public-split-pane-layout-container">
      <div class="kong-ui-public-split-pane-layout-content">
        <SplitPane :push-other-panes="true">
          <SplitPaneItem
            :max-size="showLeftPane ? 25 : 0"
            :min-size="showLeftPane ? 18 : 0"
            :show-divider-handle="false"
            :size="showLeftPane ? 18 : 0"
          >
            <div ref="leftPaneRef">
              <slot name="left-pane" />
            </div>
          </SplitPaneItem>
          <SplitPaneItem
            :min-size="20"
            :show-divider-handle="false"
            :size="37"
          >
            <slot name="middle-pane" />
          </SplitPaneItem>
          <SplitPaneItem
            :max-size="60"
            :min-size="20"
            :show-divider-handle="false"
            :size="45"
          >
            <slot name="right-pane" />
          </SplitPaneItem>
        </SplitPane>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SplitPaneItem from './SplitPaneItem.vue'
import SplitPane from './SplitPane.vue'
import { ref } from 'vue'

const showLeftPane = ref(true)
</script>

<style lang="scss" scoped>
.kong-ui-public-split-pane-layout {
  background-color: $kui-navigation-color-background;
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 2000;

  &-container {
    flex-direction: row;
  }

  &-container,
  &-content {
    display: flex;
    height: 100vh;
    width: 100%;
  }

  &-content {
    padding-top: $kui-space-30;
  }
}
</style>

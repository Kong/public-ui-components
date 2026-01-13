<template>
  <div class="kong-ui-public-split-pane-layout">
    <div class="kong-ui-public-split-pane-layout-container">
      <VerticalNavigation
        v-model:left-pane="showLeftPane"
        :items="navItems"
        :left-pane-width="leftPaneWidth"
      />
      <div class="kong-ui-public-split-pane-layout-content">
        <SplitPane
          :push-other-panes="false"
        >
          <SplitPaneItem
            :max-size="showLeftPane ? 25 : 0"
            :min-size="showLeftPane ? 18 : 0"
            :size="showLeftPane ? 18 : 0"
          >
            <div ref="leftPaneRef">
              <slot name="left-pane" />
            </div>
          </SplitPaneItem>
          <SplitPaneItem
            :min-size="20"
            :size="37"
          >
            <slot name="middle-pane" />
          </SplitPaneItem>
          <SplitPaneItem
            :max-size="60"
            :min-size="20"
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
import VerticalNavigation from './VerticalNavigation.vue'
import SplitPaneItem from './SplitPaneItem.vue'
import SplitPane from './SplitPane.vue'
import { ref, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'

const showLeftPane = ref(true)

const leftPaneRef = useTemplateRef<HTMLDivElement>('leftPaneRef')

const { width: leftPaneWidth } = useElementSize(leftPaneRef)

defineProps<{
  navItems?: any[]
}>()
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

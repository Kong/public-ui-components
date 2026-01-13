<template>
  <div class="as">
    <SplitPane>
      <!-- Left sidebar -->
      <Pane
        :max-size="30"
        :min-size="15"
        :size="20"
      >
        <div>Sidebar</div>
      </Pane>

      <!-- Main content area with horizontal split -->
      <Pane :min-size="40">
        <SplitPane horizontal>
          <Pane>
            <div>Top content</div>
          </Pane>
          <Pane>
            <div>Middle content</div>
          </Pane>
          <Pane>
            <div>Bottom content</div>
          </Pane>
        </SplitPane>
      </Pane>

      <!-- Right panel -->
      <Pane
        :max-size="40"
        :min-size="20"
        :size="25"
      >
        <div>Right panel</div>
      </Pane>
    </SplitPane>
  </div>
</template>

<script setup lang="ts">
import { SplitPane, SplitPaneItem as Pane } from '../src'
</script>


<style lang="scss">
.as {
  background-color: $kui-navigation-color-background;
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 2000;
}
</style>

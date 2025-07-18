<template>
  <IONode
    class="implicit-node"
    :input-handles="inputHandles"
    :output-handles="outputHandles"
  >
    <div class="body">
      <div class="title">
        <slot name="title" />
      </div>

      <slot />
    </div>
  </IONode>
</template>

<script setup lang="ts">
import IONode, { type IONodeComponentProps } from './IONode.vue'

defineProps<IONodeComponentProps>()
</script>

<style lang="scss" scoped>
.implicit-node {
  background-color: $kui-color-background-disabled;
  border-radius: $kui-border-radius-20;
  min-width: 120px;

  .body {
    padding: 0 $kui-space-40;

    .title {
      font-weight: $kui-font-weight-semibold;
      margin-bottom: $kui-space-40;
    }
  }
}
</style>

<template>
  <KEmptyState
    class="monaco-editor-status-overlay"
    :message="message"
    :title="title"
  >
    <template
      v-if="icon"
      #icon
    >
      <component
        :is="icon"
        decorative
      />
    </template>
  </KEmptyState>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  /**
   * The title to display in the empty state.
   */
  title: string
  /**
   * The message to display in the empty state.
   */
  message: string
  /**
   * The icon component to display in the empty state.
   * @default undefined
   */
  icon?: Component
}>()
</script>

<style scoped lang="scss">
.monaco-editor-status-overlay {
  background: transparent;
  left: 50%;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);

  :deep(.empty-state-content) {
    align-items: center;
    display: flex;
    flex-direction: column;

    .empty-state-icon,
    .empty-state-title,
    .empty-state-message {
      color: var(--kui-color-text-neutral-weak, #{$kui-color-text-neutral-weak});
    }

    .empty-state-title {
      text-transform: capitalize;
    }
  }
}
</style>

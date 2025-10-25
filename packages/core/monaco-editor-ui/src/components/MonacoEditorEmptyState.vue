<template>
  <KEmptyState
    class="monaco-editor-ui-empty-state"
    :message="message"
    :title="title"
  >
    <template
      v-if="icon"
      #icon
    >
      <component
        :is="icon"
        :color="KUI_COLOR_TEXT_NEUTRAL_WEAK"
        decorative
      />
    </template>
  </KEmptyState>
</template>

<script setup lang="ts">
import { KUI_COLOR_TEXT_NEUTRAL_WEAK } from '@kong/design-tokens'
import type { Component } from 'vue'

defineProps<{
  title: string
  message: string
  icon: Component
}>()
</script>

<style scoped lang="scss">
.monaco-editor-ui-empty-state {
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

    .empty-state-title,
    .empty-state-message {
      color: $kui-color-text-neutral-weak;
    }

    .empty-state-title {
      text-transform: capitalize;
    }
  }
}
</style>

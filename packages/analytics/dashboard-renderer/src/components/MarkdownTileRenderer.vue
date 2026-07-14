<template>
  <div class="markdown-tile-renderer">
    <MarkdownUi
      :editable="false"
      mode="read"
      :model-value="content"
      theme="light"
    />
  </div>
</template>

<script setup lang="ts">
import { MarkdownUi } from '@kong/markdown'
import '@kong/markdown/dist/style.css'

defineProps<{ content: string }>()
</script>

<style scoped lang="scss">
.markdown-tile-renderer {
  height: 100%;
  overflow-y: auto;
  padding: var(--kui-space-60, $kui-space-60);
}
</style>

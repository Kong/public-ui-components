<template>
  <main class="editor-container">
    <MonacoEditor
      v-model="code"
      language="json"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '../../src'

const code = ref('')
</script>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
}
</style>

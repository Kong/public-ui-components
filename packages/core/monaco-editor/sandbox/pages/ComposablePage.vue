<template>
  <main class="editor-container">
    <div>
      <input
        id="tab-a"
        v-model="activeTab"
        type="radio"
        value="editor"
      >
      <label for="tab-a">Editor</label>

      <input
        id="tab-b"
        v-model="activeTab"
        type="radio"
        value="textarea"
      >
      <label for="tab-b">Textarea</label>
    </div>

    <div
      v-if="activeTab === 'editor'"
      ref="editor"
      class="editor"
    />
    <textarea
      v-else
      v-model="code"
      class="editor"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useMonacoEditor } from '../../src'

const code = ref('')
const activeTab = ref('editor')
const editor = useTemplateRef('editor')

useMonacoEditor(editor, { code, language: 'plaintext' })
</script>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
}

.editor {
  height: 600px;
  width: 100%;
}
</style>

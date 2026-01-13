<template>
  <main class="editor-container">
    <div class="tab-container">
      <KRadio
        v-model="activeTab"
        label="Editor"
        selected-value="editor"
      />
      <KRadio
        v-model="activeTab"
        label="Textarea"
        selected-value="textarea"
      />
    </div>

    <div
      v-if="activeTab === 'editor'"
      ref="editor"
      class="editor"
    />
    <KTextArea
      v-else
      v-model="code"
      class="editor"
      resizable
      :rows="20"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { KRadio, KTextArea } from '@kong/kongponents'
import { useMonacoEditor } from '../../src'

const code = ref('')
const activeTab = ref('editor')
const editor = useTemplateRef('editor')

useMonacoEditor(editor, { code, language: 'plaintext' })
</script>

<style lang="scss" scoped>
.editor-container {
  height: 100%;
  padding: $kui-space-70;
}

.tab-container {
  display: flex;
  gap: $kui-space-60;
  margin-bottom: $kui-space-60;
}

.editor {
  height: 600px;
  width: 100%;
}
</style>

<template>
  <!-- The <div> tag here is just a placeholder for your component content. -->
  <!-- We recommend wrapping your component with a unique class when possible, as shown below. -->
  <div
    ref="editor"
    class="kong-ui-public-monaco-editor"
  >
    <p>This is the <b>MonacoEditor</b> content.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useMonacoEditor } from '../composables/useMonacoEditor'

const editor = useTemplateRef('editor')

useMonacoEditor(editor, {
  code: ref('// Type your code here...'),
  language: 'javascript',
})
</script>

<style lang="scss" scoped>
.kong-ui-public-monaco-editor {
  // Add component styles as needed
}
</style>

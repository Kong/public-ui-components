<template>
  <main class="editor-grid-container">
    <MonacoEditor
      v-model="code1"
      language="json"
      :toolbar="{
        actions: {
          format: false,
        },
      }"
    />
    <MonacoEditor
      v-model="code2"
      language="javascript"
      :toolbar="{
        actions: {
          format: { placement: 'left', order: 1 },
          search: { placement: 'center', order: 1 },
          fullScreen: { placement: 'right', order: 1 },
        },
      }"
    />
    <MonacoEditor
      v-model="code3"
      language="typescript"
      :toolbar="{
        actions: {
          format: { placement: 'left', group: 1 },
          customComment: {
            id: 'custom.comment',
            label: 'Toggle Comment',
            icon: CodeIcon,
            placement: 'left',
            group: 1,
            action: 'editor.action.commentLine', // Built-in Monaco action
            showInContextMenu: true,
            contextMenuGroupId: 'editing',
          },
          customBookmark: {
            id: 'customBookmark',
            label: 'Bookmark',
            icon: BookIcon,
            placement: 'left',
            group: 2,
            order: 1,
            showInContextMenu: true,
            contextMenuGroupId: 'custom',
            contextMenuOrder: 1,
            action: (editor: any) => {
              console.log('Bookmark clicked', editor?.editor.value?.getValue())
              showAlert('Document bookmarked!')
            },
          },
          customCopy: {
            id: 'customCopy',
            label: 'Copy All',
            icon: CopyIcon,
            placement: 'right',
            group: 1,
            order: 1,
            keybindings: ['Command', 'Shift', 'C'],
            showInContextMenu: true,
            contextMenuGroupId: 'custom',
            contextMenuOrder: 2,
            action: (editor: any) => {
              const content = editor?.editor.value?.getValue()
              copyToClipboard(content || '')
            },
          },
          search: {
            placement: 'right',
            group: 1,
            order: 2,
            showInContextMenu: false, // Hide from context menu
          },
          fullScreen: false, // disable fullscreen
        },
      }"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MonacoEditor } from '../../src'
import { BookIcon, CopyIcon, CodeIcon } from '@kong/icons'

const code1 = ref(`// Built-in Actions with Default Placement

{
  "name": "example",
  "version": "1.0.0"
}`)

const code2 = ref(`// Built-in Actions with Custom Placement

function greet(name) {
  console.log('Hello, ' + name + '!');
}

greet('World');`)

const code3 = ref(`// Built-in Actions With Custom Actions and Groups

interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
};`)

const showAlert = (message: string) => alert(message)

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('Content copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style lang="scss" scoped>
.editor-grid-container {
  background: $kui-color-background-neutral-weaker;
  box-sizing: border-box;
  display: grid;
  gap: $kui-space-20;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  height: 100%;
  padding: $kui-space-20;
  width: 100%;

  @media (max-width: $kui-breakpoint-tablet) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  @media (max-width: $kui-breakpoint-phablet) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
  }
}
</style>

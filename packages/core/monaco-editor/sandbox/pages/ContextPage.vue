<template>
  <div class="sandbox-model-context">
    <div class="editor-area">
      <MonacoEditor
        ref="monacoEditor"
        v-model="content"
        :language="language"
      />
    </div>
    <div class="controls-area">
      <KSelect
        v-model="language"
        :items="languages"
      />

      <KCard>
        Context info will be displayed below based on the cursor position.

        <ul class="list">
          <li>Lazy parsing without listeners (e.g., onDidChangeModelContent).</li>
          <li>Provides language-specific context based on the model's language (e.g., JSON AST for models in JSON).</li>
          <li>Internally uses an LRU cache to cache parsed contexts per edit version.</li>
          <li>Reuse cache across when possible across undo/redos (via alternative version ids).</li>
          <li>Automatically cleans up cached contexts when models are disposed.</li>
        </ul>
      </KCard>

      <div class="info-area">
        <KCodeBlock
          id="code-block-default"
          :code="infoContent"
          language="json"
          searchable
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { findNodeAtOffset } from 'jsonc-parser'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { getModelContext, MonacoEditor } from '../../src'
import GitHubSpec from '../assets/specs/Github.json?raw'

import type { SelectItem } from '@kong/kongponents'
import type { editor as Editor, IRange } from 'monaco-editor'

const snippetYAML = `name: Sample
version: 1.0.0
description: This is a sample YAML file.
items:
  - name: Item 1
    value: 10
  - name: Item 2
    value: 20`

const snippetTypeScript = `function greet(name: string): string {
  return 'Hello, ' + name + '!';
}`

const snippetMarkdown = `# Sample Markdown
This is a **sample** markdown document.
- Item 1
- Item 2

\`\`\`javascript
console.log('Hello, world!');
\`\`\``

const languages = ref<SelectItem[]>([
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Markdown', value: 'markdown' },
])

const editorComponentRef = useTemplateRef('monacoEditor')
const language = ref(languages.value[0].value as string)
const content = ref('')
const infoContent = ref('Click inside the editor to see context info around the cursor')
const editor = computed(() => editorComponentRef.value?.monacoEditor.editor.value)

watch(language, (newLang) => {
  switch (newLang) {
    case 'json':
      content.value = JSON.stringify(JSON.parse(GitHubSpec), null, 2)
      break
    case 'yaml':
      content.value = snippetYAML
      break
    case 'typescript':
      content.value = snippetTypeScript
      break
    case 'markdown':
      content.value = snippetMarkdown
      break
  }
}, { immediate: true })

const unwatchEditor = watch(editor, (editor) => {
  if (!editor) return

  let decorations: Editor.IEditorDecorationsCollection | undefined
  function highlightRange(editor: Editor.ICodeEditor, range: IRange) {
    decorations?.clear()
    decorations = editor.createDecorationsCollection([
      {
        range,
        options: {
          className: 'sandbox-monaco-highlight',
        },
      },
    ])
  }

  editor.onDidChangeCursorPosition(async () => {
    decorations?.clear()

    const position = editor.getPosition()
    if (!position) {
      infoContent.value = 'No cursor position available'
      return
    }

    const model = editor.getModel()
    if (!model) {
      infoContent.value = 'No model available'
      return
    }

    let context = await getModelContext(model)
    if (context.language !== model.getLanguageId() || context.altVersionId !== model.getAlternativeVersionId()) {
      // In scenario of Cursor change + Value change + Language change,
      // the model context may become outdated here because of the async calls.
      // Should always check if the context is outdated before using it.
      console.warn('Model context is outdated, re-parsing...')
      context = await getModelContext(model) // This is okay in our sandbox
    }

    if (context.isDefault) {
      infoContent.value = `No context available for '${context.language}' now`
      return
    }

    switch (context.language) {
      case 'json': {
        if (!context.root) {
          infoContent.value = 'No AST available'
          return
        }

        const node = findNodeAtOffset(context.root, model.getOffsetAt(position))
        if (!node) {
          infoContent.value = 'No node found at cursor position'
          return
        }

        highlightRange(editor, {
          startLineNumber: model.getPositionAt(node.offset).lineNumber,
          startColumn: model.getPositionAt(node.offset).column,
          endLineNumber: model.getPositionAt(node.offset + node.length).lineNumber,
          endColumn: model.getPositionAt(node.offset + node.length).column,
        })
        const info: Record<string, any> = {
          type: node.type,
          offset: node.offset,
          length: node.length,
        }
        switch (node.type) {
          case 'boolean':
          case 'null':
          case 'number':
          case 'string':
            info.value = node.value
            break
          case 'array':
            info.childrenCount = node.children?.length ?? 0
            break
          case 'object':
            info.propertiesCount = node.children?.length ?? 0
            break
        }
        infoContent.value = JSON.stringify(info, null, 2)
        break
      }
    }
  })

  unwatchEditor()
})
</script>

<style lang="scss" scoped>
.sandbox-model-context {
  box-sizing: border-box;
  display: grid;
  gap: $kui-space-40;
  grid-template-columns: minmax(600px, 1fr) minmax(400px, 600px);
  height: 100%;
  width: 100%;

  .editor-area {
    height: 100%;

    :deep(.sandbox-monaco-highlight) {
      background: rgba($kui-color-background-warning-weaker, 0.85);
    }
  }

  .controls-area {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
    min-height: 0;
    padding: $kui-space-80 $kui-space-80;

    .list {
      margin: $kui-space-20 0 0 $kui-space-20;
      padding: $kui-space-40;
    }

    .info-area {
      flex-grow: 1;
      overflow: auto;
    }
  }
}
</style>

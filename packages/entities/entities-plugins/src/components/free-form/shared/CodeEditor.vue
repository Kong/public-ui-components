<template>
  <div
    class="plugin-code-editor"
    data-testid="plugin-code-editor"
  >
    <MonacoEditor
      ref="editor"
      v-model="code"
      class="editor"
      language="yaml"
      :options="monacoOptions"
      theme="light"
      @ready="handleEditorReady"
    />
  </div>
</template>

<script setup lang="ts">
import { shallowRef, toRaw } from 'vue'
import { omit } from 'lodash-es'
import * as monaco from 'monaco-editor'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import { useFormShared } from '../shared/composables'

import '@kong-ui-public/monaco-editor/dist/runtime/style.css'

const { formData, setValue } = useFormShared()

const emit = defineEmits<{
  change: [config: unknown]
  sourceChange: [config: string]
  error: [msg: string]
}>()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

const LINT_SOURCE = 'YAML Syntax'

function formDataToCode(): string {
  return yaml.dump(toRaw(omit(formData, ['__ui_data'])), {
    schema: JSON_SCHEMA,
    noArrayIndent: true,
  })
}

const code = shallowRef(formDataToCode())
const monacoOptions = {
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
  autoIndent: 'keep',
  editContext: false,
} as const satisfies Partial<monaco.editor.IStandaloneEditorConstructionOptions>

function handleEditorReady(editor: monaco.editor.IStandaloneCodeEditor) {
  const model = editor.getModel()
  if (!model) {
    return
  }

  editorRef.value = editor

  editor.onDidChangeModelContent(() => {
    try {
      const config = yaml.load(editor.getValue() || '', {
        schema: JSON_SCHEMA,
        json: true,
      })

      emit('sourceChange', editor.getValue())

      if (typeof config !== 'object' || config === null) {
        return
      }

      monaco.editor.setModelMarkers(model, LINT_SOURCE, [])

      setValue(config)
      emit('change', config)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      emit('error', errorMsg)
    }
  })

  focusEnd()
}

function focusEnd() {
  const editor = editorRef.value
  const model = editor?.getModel()
  if (!editor || !model) {
    return
  }

  editor.setPosition(model.getFullModelRange().getEndPosition())
  editor.focus()
}

</script>

<style lang="scss" scoped>
.plugin-code-editor {
  height: 684px;
  position: relative;
  width: 100%;
}
</style>

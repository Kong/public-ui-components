<template>
  <div class="code-editor">
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
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import { useFormShared } from '../shared/composables'

import type { YAMLException } from 'js-yaml'

const { formData, setValue } = useFormShared()

const emit = defineEmits<{
  change: [config: unknown]
  error: [msg: string]
}>()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

const LINT_SOURCE = 'YAML Syntax'

function dumpYaml(config: unknown): string {
  return yaml.dump(toRaw(config), {
    schema: JSON_SCHEMA,
    noArrayIndent: true,
  })
}

function formDataToCode(): string {
  return dumpYaml(omit(formData, ['__ui_data']))
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

      if (typeof config !== 'object' || config === null) {
        return
      }

      monaco.editor.setModelMarkers(model, LINT_SOURCE, [])

      setValue(config)
      emit('change', config)
    } catch (error: unknown) {
      const { message, mark } = error as YAMLException
      const { line, column } = mark || { line: 0, column: 0 }

      const simpleMessage = message.split('\n')[0] // Take the first line of the error message

      const markers: monaco.editor.IMarkerData[] = [
        {
          startLineNumber: line + 1,
          startColumn: column + 1,
          endLineNumber: line + 1,
          endColumn: column + 2,
          message: simpleMessage,
          severity: monaco.MarkerSeverity.Error,
          source: LINT_SOURCE,
        },
      ]

      monaco.editor.setModelMarkers(model, LINT_SOURCE, markers)

      emit('error', simpleMessage)
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
.code-editor {

  .editor {
    height: 684px;
    width: 100%;
  }
}
</style>

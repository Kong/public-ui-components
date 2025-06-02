<template>
  <StandardLayout
    v-bind="props"
    class="dk-form"
  >
    <div
      ref="editor-root"
      class="editor"
    />
  </StandardLayout>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, useTemplateRef, toRaw, onBeforeUnmount } from 'vue'
import * as monaco from 'monaco-editor'
import type { YAMLException } from 'js-yaml'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import StandardLayout from '../shared/layout/StandardLayout.vue'

import type { Props } from '../shared/layout/StandardLayout.vue'

const props = defineProps<Props<any>>()

const editorRoot = useTemplateRef('editor-root')
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const LINT_SOURCE = 'YAML Syntax'

onMounted(() => {
  editor.value = monaco.editor.create(editorRoot.value!, {
    language: 'yaml',
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
    scrollBeyondLastLine: false,
    tabSize: 2,
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
  })

  editor.value.setValue(yaml.dump(toRaw(props.model.config), {
    schema: JSON_SCHEMA,
  }))

  editor.value.onDidChangeModelContent(() => {
    const model = editor.value!.getModel()
    const value = editor.value!.getValue() || ''
    try {
      const config = yaml.load(value, {
        schema: JSON_SCHEMA,
        json: true,
      })

      monaco.editor.setModelMarkers(model!, LINT_SOURCE, [])

      props.onFormChange({
        config,
      })
      props.onValidityChange?.({
        model: 'config',
        valid: true,
      })
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

      monaco.editor.setModelMarkers(model!, LINT_SOURCE, markers)

      props.onValidityChange?.({
        model: 'config',
        valid: false,
        error: simpleMessage,
      })
    }
  })
})

onBeforeUnmount(() => {
  editor.value?.dispose()
})
</script>

<style lang="scss" scoped>
.dk-form {
  .editor {
    height: 684px;
    width: 100%;
  }
}
</style>

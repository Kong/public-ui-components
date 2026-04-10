<template>
  <div
    class="plugin-code-editor"
    data-testid="plugin-code-editor"
  >
    <div class="editor-shell">
      <div
        class="code-editor-toolbar"
        data-testid="code-editor-toolbar"
      >
        <KInputSwitch
          v-model="skipDefaults"
          data-testid="code-editor-skip-defaults"
        >
          <template #label>
            {{ t('plugins.free-form.code_editor.skip_defaults') }}
          </template>
        </KInputSwitch>
      </div>

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
  </div>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import * as monaco from 'monaco-editor'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import { KInputSwitch } from '@kong/kongponents'
import { useFormShared, useSchemaHelpers, useSkipDefaults } from './composables'
import useI18n from '../../../composables/useI18n'

import '@kong-ui-public/monaco-editor/dist/runtime/style.css'

const { i18n: { t } } = useI18n()
const { getValue, setValue, schema } = useFormShared()
const { getDefault: getDefaultFromSchema } = useSchemaHelpers(schema)
const {
  skipDefaults,
  toCode,
  handleContentChange,
  regenerateCode,
} = useSkipDefaults({
  getValue,
  setValue,
  getDefaultFromSchema,
})

const emit = defineEmits<{
  change: [config: unknown]
  sourceChange: [config: string]
  error: [msg: string]
}>()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

const LINT_SOURCE = 'YAML Syntax'

const code = shallowRef(toCode())
const monacoOptions = {
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
  autoIndent: 'keep',
  editContext: false,
} as const satisfies Partial<monaco.editor.IStandaloneEditorConstructionOptions>

watch(skipDefaults, () => {
  regenerateCode(code)
})

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

      const nextConfig = handleContentChange(config as Record<string, any>)
      if (!nextConfig) {
        return
      }

      emit('sourceChange', editor.getValue())
      emit('change', nextConfig)
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
  width: 100%;

  .editor-shell {
    height: 100%;
    position: relative;
  }

  .code-editor-toolbar {
    display: flex;
    position: absolute;
    right: 16px;
    top: 16px;
    z-index: 10;
  }

  .editor {
    height: 100%;
    min-height: 0;
  }
}
</style>

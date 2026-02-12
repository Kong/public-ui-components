<template>
  <div class="code-editor">
    <MonacoEditor
      ref="editor"
      v-model="code"
      class="editor"
      :class="{ hidden: showDiff }"
      language="yaml"
      :options="monacoOptions"
      theme="light"
      @ready="handleEditorReady"
    />
    <div
      v-show="showDiff"
      ref="diffContainer"
      class="diff-editor"
    />
    <div
      v-if="showDiff"
      class="diff-actions"
    >
      <KButton
        appearance="primary"
        @click="handleApply"
      >
        Keep
      </KButton>
      <KButton
        appearance="secondary"
        @click="handleCancel"
      >
        Cancel
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, toRaw } from 'vue'
import { omit } from 'lodash-es'
import * as monaco from 'monaco-editor'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import { KButton } from '@kong/kongponents'
import { useFormShared } from '../shared/composables'

import type { YAMLException } from 'js-yaml'

interface DiffResult {
  oldContent: string
  newContent: string
  hasChanges: boolean
}

interface DiffOptions {
  diffView?: 'inline' | 'side-by-side'
  onBeforeApply?: (diff: DiffResult) => boolean | Promise<boolean>
}

interface DiffControls {
  apply: () => Promise<void>
  cancel: () => void
  diffResult: DiffResult
}

const { formData, setValue } = useFormShared()

const emit = defineEmits<{
  change: [config: unknown]
  sourceChange: [config: string]
  error: [msg: string]
  diffApplied: []
  diffCancelled: []
}>()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const diffContainer = shallowRef<HTMLElement | null>(null)
const showDiff = shallowRef(false)
const diffControls = shallowRef<DiffControls | null>(null)

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

      emit('sourceChange', editor.getValue())

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

function handleApply() {
  diffControls.value?.apply()
  emit('diffApplied')
}

function handleCancel() {
  diffControls.value?.cancel()
  emit('diffCancelled')
}

/**
 * Update editor content with undo support
 * @param newContent - The new content to set
 */
function updateContent(newContent: string): void {
  const editor = editorRef.value
  const model = editor?.getModel()

  if (!editor || !model) {
    console.warn('Editor or model is not ready')
    return
  }

  // Use executeEdits to make the change undoable
  editor.executeEdits('updateContent', [
    {
      range: model.getFullModelRange(),
      text: newContent,
    },
  ])
}

/**
 * Update editor content with diff view
 * @param newContent - The new content to set
 * @param options - Diff options
 * @returns DiffControls object with apply and cancel methods
 */
function updateContentWithDiff(newContent: string, options: DiffOptions = { diffView: 'side-by-side' }): DiffControls {
  const { diffView = 'inline', onBeforeApply } = options
  const editor = editorRef.value
  const model = editor?.getModel()
  const container = diffContainer.value

  if (!editor || !model || !container) {
    throw new Error('Editor or model is not ready')
  }

  const oldContent = editor.getValue()
  const hasChanges = oldContent !== newContent

  const diffResult: DiffResult = {
    oldContent,
    newContent,
    hasChanges,
  }

  // If no changes, directly return no-op controls
  if (!hasChanges) {
    return {
      apply: async () => {},
      cancel: () => {},
      diffResult,
    }
  }

  // Show diff container
  showDiff.value = true

  // Create diff models
  const originalModel = monaco.editor.createModel(oldContent, 'yaml')
  const modifiedModel = monaco.editor.createModel(newContent, 'yaml')

  // Create diff editor in the dedicated container
  const diffEditor = monaco.editor.createDiffEditor(container, {
    renderSideBySide: diffView === 'side-by-side',
    readOnly: true,
    originalEditable: false,
    automaticLayout: true,
    scrollbar: {
      alwaysConsumeMouseWheel: false,
    },
  })

  diffEditor.setModel({
    original: originalModel,
    modified: modifiedModel,
  })

  // Track if cleanup has been done
  let isCleanedUp = false

  const cleanup = () => {
    if (isCleanedUp) return
    isCleanedUp = true

    showDiff.value = false
    diffControls.value = null
    diffEditor.dispose()
    originalModel.dispose()
    modifiedModel.dispose()
  }

  const apply = async () => {
    if (onBeforeApply) {
      const shouldApply = await onBeforeApply(diffResult)
      if (!shouldApply) {
        return
      }
    }

    cleanup()
    updateContent(newContent)
  }

  const cancel = () => {
    cleanup()
  }

  const controls = {
    apply,
    cancel,
    diffResult,
  }

  // Store controls for button handlers
  diffControls.value = controls

  return controls
}

defineExpose({
  updateContent,
  updateContentWithDiff,
  focusEnd,
})

</script>

<style lang="scss" scoped>
.code-editor {
  height: 684px;
  position: relative;
  width: 100%;

  .editor {
    height: 100%;
    width: 100%;

    &.hidden {
      display: none;
    }
  }

  .diff-editor {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  .diff-actions {
    display: flex;
    gap: 8px;
    position: absolute;
    right: 32px;
    top: 16px;
    z-index: 10;
  }
}
</style>

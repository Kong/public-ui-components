<template>
  <div
    class="plugin-code-editor"
    data-testid="plugin-code-editor"
  >
    <MonacoEditor
      :key="activeColorMode"
      ref="editor"
      v-model="code"
      class="editor"
      language="yaml"
      :options="monacoOptions"
      :theme="activeColorMode"
      @ready="handleEditorReady"
    />
  </div>
</template>

<script setup lang="ts">
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { collectValidators, createZodValidator, MonacoEditor } from '@kong-ui-public/monaco-editor'
import { runYAMLValidation } from '@kong-ui-public/monaco-editor/languages/yaml'
import { dump, load, JSON_SCHEMA } from 'js-yaml'
import { omit } from 'lodash-es'
import * as monaco from 'monaco-editor'
import { computed, inject, shallowRef, toRaw, type ComputedRef } from 'vue'

import { useFormShared } from '../shared/composables'
import { useCodeLensProviders } from './composables/code-lens-providers'
import { luaSchemaToZod } from '../../../utils/lua-schema-to-zod'

import '@kong-ui-public/monaco-editor/dist/runtime/style.css'

import type { FormSchema } from '../../../types/plugins/form-schema'
import type { KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../../../types'

const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))

const config = inject<KonnectPluginFormConfig | KongManagerPluginFormConfig>(FORMS_CONFIG)!
const { formData, setValue, schema } = useFormShared()

// `schema` is always the plugin's own record schema in this context (not a
// bare field schema), so it's safe to compile as-is.
// `strict` is used to show real validation errors (markers). `compat` is
// used only to decide whether it's currently safe to switch back to the
// visual form - see the lua-schema-to-zod README's "Compat mode" section.
const zodSchema = computed(() => luaSchemaToZod(schema as FormSchema))
const compatSchema = computed(() => luaSchemaToZod(schema as FormSchema, 'compat'))
const validateSchema = computed(() => collectValidators([createZodValidator(zodSchema.value)]))

const emit = defineEmits<{
  change: [config: unknown]
  sourceChange: [config: string]
  error: [msg: string]
  /** Whether the current code is safe to switch back to the visual form. */
  compatChange: [result: { valid: boolean, message: string }]
}>()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const { setup: setupCodeLensProviders } = useCodeLensProviders(config, {
  validateStatus: (status) => status >= 200 && status < 500,
})

const LINT_SOURCE = 'YAML Syntax'
const SCHEMA_VALIDATION_SOURCE = 'Schema Validation'

// The tooltip that shows this has limited space, so only the first issue is
// shown; its line/column comes from the same YAML-position-mapping used for
// markers, so the user can jump straight to the spot.
function formatCompatMessage(issue: { message: string, range: monaco.IRange }): string {
  return `${issue.message} :${issue.range.startLineNumber}:${issue.range.startColumn}`
}

function formDataToCode(): string {
  return dump((omit(toRaw(formData), ['__ui_data'])), {
    schema: JSON_SCHEMA,
    seqNoIndent: true,
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

  setupCodeLensProviders(model)
  editorRef.value = editor

  // Every issue becomes a marker regardless of `rangeKind` - `ancestor`
  // ranges can span a whole block (e.g. a missing required field underlines
  // its containing mapping) and `document` is just a compact anchor at the
  // start of the file (e.g. an empty editor missing a required top-level
  // field), same as VS Code's JSON/YAML schema validation. None of them
  // produce a sprawling, unhelpful range anymore.
  async function runSchemaValidation() {
    try {
      // Non-null: `model` was already checked above; TS just can't narrow a
      // `const` across this nested function declaration's boundary.
      const issues = await runYAMLValidation(model!, validateSchema.value)
      monaco.editor.setModelMarkers(model!, SCHEMA_VALIDATION_SOURCE, issues.map((issue) => ({
        ...issue.range,
        message: issue.message,
        severity: monaco.MarkerSeverity.Error,
      })))
    } catch (error: unknown) {
      console.error('[CodeEditor] schema validation failed:', error)
    }
  }

  async function syncFromEditor() {
    let config: unknown
    try {
      config = load(editor.getValue() || '', {
        schema: JSON_SCHEMA,
        json: true,
      })

      emit('sourceChange', editor.getValue())
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      emit('error', errorMsg)
      return
    }

    if (typeof config !== 'object' || config === null) {
      return
    }

    // Non-null: see the comment on `runSchemaValidation` above.
    monaco.editor.setModelMarkers(model!, LINT_SOURCE, [])

    // Goes through `runYAMLValidation` (not a plain `compatSchema.safeParse`)
    // so the issue comes with a line/column, not just a message.
    const compatIssues = await runYAMLValidation(model!, createZodValidator(compatSchema.value))
    const [firstCompatIssue] = compatIssues
    emit('compatChange', {
      valid: !firstCompatIssue,
      message: firstCompatIssue ? formatCompatMessage(firstCompatIssue) : '',
    })

    // Only sync into the shared form state (which the visual form directly
    // renders from) when it's compat-safe - never let a value that would
    // break or blank out the visual form reach it. If it's not safe, the
    // form simply keeps showing its last good state.
    if (!firstCompatIssue) {
      setValue(config)
      emit('change', config)
    }
  }

  editor.onDidChangeModelContent(() => {
    syncFromEditor()
    runSchemaValidation()
  })

  // Run once immediately against the initial content - `onDidChangeModelContent`
  // only fires on subsequent edits, so without this a freshly opened editor
  // would show no schema issues (and no compat status) until the user typed
  // something.
  syncFromEditor()
  runSchemaValidation()

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

<template>
  <div class="dk-code-editor">
    <KAlert class="examples">
      <div class="examples-content">
        {{ t('plugins.free-form.datakit.description_example') }}

        <KButton
          v-for="(_, key) in examples"
          :key="key"
          appearance="secondary"
          size="small"
          @click="setExampleCode(key)"
        >
          {{ t(`plugins.free-form.datakit.examples.${key}`) }}
        </KButton>
      </div>

      <template #icon>
        <SparklesIcon />
      </template>
    </KAlert>
    <MonacoEditor
      ref="editor"
      v-model="code"
      appearance="standalone"
      class="editor"
      language="yaml"
      :model-uri="modelUri"
      :options="monacoOptions"
      theme="light"
      @ready="handleEditorReady"
    />

    <KModal
      :action-button-text="t('plugins.free-form.datakit.detected_config_format_confirm')"
      :title="t('plugins.free-form.datakit.detected_config_format_title')"
      :visible="showConvertModal"
      @cancel="handleConvertCancel"
      @proceed="handleConvertConfirm"
    >
      {{ t('plugins.free-form.datakit.detected_config_format', { format: pendingExtractorName }) }}
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, shallowRef, toRaw } from 'vue'
import { isEqual, omit } from 'lodash-es'
import * as monaco from 'monaco-editor'
import { LineCounter, parseDocument, stringify } from 'yaml'
import { createI18n } from '@kong-ui-public/i18n'
import { KAlert, KButton, KModal } from '@kong/kongponents'
import { SparklesIcon } from '@kong/icons'
import { useErrors } from '@kong-ui-public/entities-shared'
import { MonacoEditor, attachYamlJsonSchema } from '@kong-ui-public/monaco-editor'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import english from '../../../locales/en.json'
import { useFormShared } from '../shared/composables'
import examples from './examples'
import { extractors } from './config-extractors'
import { DatakitConfigSchema as DatakitConfigCompatSchema } from './schema/compat'
import { DatakitConfigSchema as DatakitConfigStrictSchema } from './schema/strict'
import { buildPathIndex } from './code-editor/yaml-path-index'
import { zodIssuesToMarkers } from './code-editor/zod-issue-markers'
import { getDatakitYamlSchema } from './code-editor/yaml-schema'
import { createDatakitRefCompletionExtension } from './code-editor/datakit-ref-completions'
import { createDatakitPropertyCompletionExtension } from './code-editor/datakit-property-completions'

import type { ZodError } from 'zod'
import type { DatakitPluginData } from './types'

const { t } = createI18n<typeof english>('en-us', english)

const { formData, setValue } = useFormShared<DatakitPluginData>()

defineProps<{
  editing: boolean
}>()

const emit = defineEmits<{
  change: [config: unknown]
  error: [msg: string]
  validation: [{
    compatSuccess: boolean
    compatError: ZodError | null
    strictSuccess: boolean
    strictError: ZodError | null
  }]
}>()

const { getMessageFromError } = useErrors()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const yamlDisposable = shallowRef<{ dispose: () => void } | null>(null)

const LINT_SOURCE = 'YAML Syntax'
const COMPAT_SCHEMA_SOURCE = 'Datakit schema (compat)'
const STRICT_SCHEMA_SOURCE = 'Datakit schema'

function dumpYaml(config: unknown): string {
  return stringify(toRaw(config), {
    indentSeq: false,
    schema: 'yaml-1.1',
    defaultKeyType: 'PLAIN',
    defaultStringType: 'PLAIN',
  })
}

function formDataToCode(): string {
  return dumpYaml(omit(formData, ['__ui_data']))
}

const code = shallowRef(formDataToCode())
const modelSuffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2)
const modelUri = `inmemory://model/datakit-${modelSuffix}.yaml`
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

  yamlDisposable.value?.dispose()
  const yamlSchema = getDatakitYamlSchema()
  yamlDisposable.value = attachYamlJsonSchema(monaco, editor, {
    yamlVersion: '1.1',
    schema: yamlSchema,
    style: { arrayItemStyle: 'indentless' },
    extensions: [
      createDatakitRefCompletionExtension(monaco),
      createDatakitPropertyCompletionExtension(monaco),
    ],
  })

  const validateCodeText = (codeText: string, opts?: { updateFormData?: boolean }) => {
    const lineCounter = new LineCounter()
    const doc = parseDocument(codeText, {
      lineCounter,
      schema: 'yaml-1.1',
    })

    if (doc.errors.length > 0) {
      const markers = doc.errors.map((error) => {
        const message = error.message.split('\n')[0]
        const pos = Array.isArray(error.pos)
          ? error.pos
          : typeof error.pos === 'number'
            ? [error.pos, error.pos + 1]
            : [0, 1]
        const startOffset = Number.isFinite(pos?.[0]) ? pos?.[0] ?? 0 : 0
        const endOffset = Number.isFinite(pos?.[1])
          ? pos?.[1] ?? startOffset + 1
          : startOffset + 1
        const start = lineCounter.linePos(startOffset)
        const end = lineCounter.linePos(endOffset)
        const endColumn = end.line === start.line ? Math.max(end.col, start.col + 1) : end.col

        return {
          startLineNumber: start.line,
          startColumn: start.col,
          endLineNumber: end.line,
          endColumn,
          message,
          severity: monaco.MarkerSeverity.Error,
          source: LINT_SOURCE,
        }
      })

      monaco.editor.setModelMarkers(model, LINT_SOURCE, markers)
      monaco.editor.setModelMarkers(model, COMPAT_SCHEMA_SOURCE, [])
      monaco.editor.setModelMarkers(model, STRICT_SCHEMA_SOURCE, [])

      emit('error', doc.errors[0]?.message.split('\n')[0] ?? 'Invalid YAML')
      return
    }

    monaco.editor.setModelMarkers(model, LINT_SOURCE, [])

    const parsed = doc.toJS()

    if (opts?.updateFormData && typeof parsed === 'object' && parsed !== null) {
      setValue(parsed as DatakitPluginData)
      emit('change', parsed)
    }

    const configValue = (parsed as DatakitPluginData | undefined)?.config
    const compatResult = DatakitConfigCompatSchema.safeParse(configValue)
    const strictResult = DatakitConfigStrictSchema.safeParse(configValue)

    emit('validation', {
      compatSuccess: compatResult.success,
      compatError: compatResult.success ? null : compatResult.error,
      strictSuccess: strictResult.success,
      strictError: strictResult.success ? null : strictResult.error,
    })

    const index = buildPathIndex(doc.contents)

    if (!strictResult.success) {
      monaco.editor.setModelMarkers(model, COMPAT_SCHEMA_SOURCE, [])

      const issueMarkers = zodIssuesToMarkers(strictResult.error.issues, {
        index,
        lineCounter,
        prefixPath: ['config'],
        maxMarkers: 200,
      })

      const markers: monaco.editor.IMarkerData[] = issueMarkers.map((marker) => ({
        ...marker.range,
        message: marker.message,
        severity: monaco.MarkerSeverity.Error,
        source: STRICT_SCHEMA_SOURCE,
      }))

      monaco.editor.setModelMarkers(model, STRICT_SCHEMA_SOURCE, markers)
      return
    }

    monaco.editor.setModelMarkers(model, STRICT_SCHEMA_SOURCE, [])

    if (compatResult.success) {
      monaco.editor.setModelMarkers(model, COMPAT_SCHEMA_SOURCE, [])
      return
    }

    const issueMarkers = zodIssuesToMarkers(compatResult.error.issues, {
      index,
      lineCounter,
      prefixPath: ['config'],
      maxMarkers: 200,
    })

    const markers: monaco.editor.IMarkerData[] = issueMarkers.map((marker) => ({
      ...marker.range,
      message: marker.message,
      severity: monaco.MarkerSeverity.Warning,
      source: COMPAT_SCHEMA_SOURCE,
    }))

    monaco.editor.setModelMarkers(model, COMPAT_SCHEMA_SOURCE, markers)
  }

  editor.onDidChangeModelContent(() => {
    validateCodeText(editor.getValue() || '', { updateFormData: true })
  })

  // Run initial validation so the form validity and markers match the initial editor content.
  validateCodeText(editor.getValue() || '', { updateFormData: false })

  editor.onDidPaste((e) => {
    const model = editor.getModel()
    if (!model) return

    const pastedText = model.getValueInRange(e.range)

    for (const extractor of extractors) {
      const extractedConfig = extractor.extract(pastedText)
      if (extractedConfig) {
        pendingConfig.value = extractedConfig
        pendingExtractorName.value = extractor.name
        showConvertModal.value = true
        return
      }
    }
  })

  focusEnd()
}

onBeforeUnmount(() => {
  yamlDisposable.value?.dispose()
})

const showConvertModal = shallowRef(false)
const pendingConfig = shallowRef<unknown | null>(null)
const pendingExtractorName = shallowRef('')

function handleConvertCancel() {
  showConvertModal.value = false
  pendingConfig.value = null
  pendingExtractorName.value = ''
}

function handleConvertConfirm() {
  if (!pendingConfig.value) return

  code.value = dumpYaml(pendingConfig.value)

  handleConvertCancel()
}

/**
 * Sets the example code in the Monaco editor.
 * We do not use `setValue` directly because it will clear the undo stack,
 * which prevents the user from undoing changes after inserting an example.
 */
function setExampleCode(example: keyof typeof examples) {
  const newCode = examples[example]

  try {
    const config = parseDocument(code.value, { schema: 'yaml-1.1' }).toJS() as any

    const exampleConfigJson = parseDocument(newCode, { schema: 'yaml-1.1' }).toJS() as any

    if (typeof config === 'object' && config !== null && isEqual(config.config, exampleConfigJson)) return

    const nextConfig = omit({
      ...formData,
      config: { ...exampleConfigJson },
    }, ['__ui_data'])

    code.value = dumpYaml(nextConfig)
  } catch (error: unknown) {
    emit('error', getMessageFromError(error))
  }

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

defineExpose({
  setExampleCode,
})
</script>

<style lang="scss" scoped>
.dk-code-editor {
  .examples {
    margin-bottom: $kui-space-70;
  }

  .examples-content {
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-40;
  }

  .editor {
    height: 684px;
    width: 100%;
  }
}
</style>

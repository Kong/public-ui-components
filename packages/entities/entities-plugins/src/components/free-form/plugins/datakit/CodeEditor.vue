<template>
  <div class="dk-code-editor">
    <KAlert class="examples">
      <div class="examples-content">
        {{ t('plugins.free-form.datakit.description_example') }}

        <KButton
          v-for="example in examples"
          :key="example.id"
          appearance="secondary"
          size="small"
          @click="setExampleCode(example)"
        >
          {{ getExampleLabel(example.i18nKey) }}
        </KButton>
      </div>

      <template #icon>
        <SparklesIcon />
      </template>
    </KAlert>

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
        appearance="standalone"
        class="editor"
        language="yaml"
        :options="monacoOptions"
        theme="light"
        @ready="handleEditorReady"
      />
    </div>

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
import { shallowRef, watch } from 'vue'
import { isEqual } from 'lodash-es'
import * as monaco from 'monaco-editor'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { createI18n } from '@kong-ui-public/i18n'
import { KAlert, KButton, KInputSwitch, KModal } from '@kong/kongponents'
import { SparklesIcon } from '@kong/icons'
import { useErrors } from '@kong-ui-public/entities-shared'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import english from '../../../../locales/en.json'
import { useFormShared, useSchemaHelpers, useSkipDefaults } from '../../shared/composables'
import examples from './examples'
import { extractors } from './config-extractors'

import type { YAMLException } from 'js-yaml'
import type { DatakitPluginData } from './types'
import type { DatakitExample } from './examples'

const { t } = createI18n<typeof english>('en-us', english)
type TranslationKey = Parameters<typeof t>[0]

const { getValue, setValue, schema } = useFormShared<DatakitPluginData>()
const { getDefault: getDefaultFromSchema } = useSchemaHelpers(schema)
const {
  skipDefaults,
  toCode,
  handleContentChange,
  regenerateCode,
} = useSkipDefaults<DatakitPluginData>({
  getValue,
  setValue,
  getDefaultFromSchema,
})

defineProps<{
  editing: boolean
}>()

const emit = defineEmits<{
  change: [config: unknown]
  error: [msg: string]
}>()

const { getMessageFromError } = useErrors()

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

const LINT_SOURCE = 'YAML Syntax'

function syncCodeEditor(nextConfig: DatakitPluginData) {
  setValue(nextConfig)
  regenerateCode(code, toCode(nextConfig))
  emit('change', nextConfig)
}

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

      if (typeof config !== 'object' || config === null) {
        return
      }

      monaco.editor.setModelMarkers(model, LINT_SOURCE, [])

      const nextConfig = handleContentChange(config as DatakitPluginData)
      if (!nextConfig) {
        return
      }

      emit('change', nextConfig)
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

  syncCodeEditor(pendingConfig.value as DatakitPluginData)

  handleConvertCancel()
}

function getExampleLabel(i18nKey: string): string {
  return t(`plugins.free-form.datakit.examples.${i18nKey}` as TranslationKey)
}

/**
 * Sets the example code in the Monaco editor.
 * We do not use `setValue` directly because it will clear the undo stack,
 * which prevents the user from undoing changes after inserting an example.
 */
function setExampleCode(example: DatakitExample) {
  const currentData = getValue()

  try {
    const exampleConfig = yaml.load(example.code, {
      schema: JSON_SCHEMA,
      json: true,
    })

    if (typeof exampleConfig !== 'object' || exampleConfig === null) {
      return
    }

    if (isEqual(currentData.config, exampleConfig)) {
      return
    }

    const nextConfig = {
      ...currentData,
      config: { ...(exampleConfig as DatakitPluginData['config']) },
    }

    syncCodeEditor(nextConfig as DatakitPluginData)
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
    margin-bottom: var(--kui-space-40, $kui-space-40);
  }

  .examples-content {
    display: flex;
    flex-wrap: wrap;
    gap: var(--kui-space-40, $kui-space-40);
  }

  .editor-shell {
    height: 684px;
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
    width: 100%;
  }
}
</style>
